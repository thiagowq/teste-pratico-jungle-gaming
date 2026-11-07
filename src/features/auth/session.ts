import { useSyncExternalStore } from 'react'
import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import * as authApi from '@/api/auth'
import { onAuthFailure } from '@/api/client'
import type { AuthResponse, SessionResponse } from '@/api/contracts/auth'
import type { ApiError } from '@/api/errors'
import { getSessionToken, setSessionToken, subscribeSessionToken } from '@/api/session-token'
import { queryKeys } from '@/lib/query-keys'
import { realtime } from '@/realtime/socket'

export const sessionQuery = (token: string | null) =>
  queryOptions({
    queryKey: queryKeys.session(token),
    queryFn: async ({ signal }): Promise<SessionResponse | null> => (token ? authApi.fetchSession(signal) : null),
    staleTime: 5 * 60_000,
    retry: (failureCount, error) => !(error as ApiError).isAuthError && failureCount < 2,
  })

export function useSessionToken() {
  return useSyncExternalStore(subscribeSessionToken, getSessionToken, () => null)
}

/** Sessão atual: `user` é `null` para visitantes. */
export function useSession() {
  const token = useSessionToken()
  const query = useQuery(sessionQuery(token))
  return {
    token,
    user: query.data?.user ?? null,
    isPending: token !== null && query.isPending,
    error: query.error as ApiError | null,
  }
}

/* ---------- Aviso de sessão encerrada (lido pela UI) ---------- */

export type SessionEndReason = 'expired' | 'logout' | null
let endReason: SessionEndReason = null
const endListeners = new Set<() => void>()

export function useSessionEndReason() {
  return useSyncExternalStore(
    (listener) => {
      endListeners.add(listener)
      return () => endListeners.delete(listener)
    },
    () => endReason,
    () => null,
  )
}

export function clearSessionEndReason() {
  endReason = null
  endListeners.forEach((listener) => listener())
}

/* ---------- Transições de sessão ---------- */

/** Remove todo dado privado do cache (favoritos, carrinho, pedidos, perfil...). */
function clearPrivateCache(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: queryKeys.user.all })
  queryClient.removeQueries({ queryKey: ['session'] })
}

export function startSession(queryClient: QueryClient, response: AuthResponse) {
  const previousUserId = queryClient.getQueryData(sessionQuery(getSessionToken()).queryKey)?.user.id
  if (previousUserId && previousUserId !== response.user.id) clearPrivateCache(queryClient)
  const next: SessionResponse = { user: response.user, expiresAt: response.session.expiresAt }
  queryClient.setQueryData(sessionQuery(response.session.token).queryKey, () => next)
  clearSessionEndReason()
  setSessionToken(response.session.token)
}

export function endSession(queryClient: QueryClient, reason: Exclude<SessionEndReason, null>) {
  setSessionToken(null)
  clearPrivateCache(queryClient)
  endReason = reason
  endListeners.forEach((listener) => listener())
}

export async function logout(queryClient: QueryClient) {
  try {
    await authApi.logout()
  } finally {
    // Mesmo sem rede, a sessão local é encerrada.
    endSession(queryClient, 'logout')
  }
}

/**
 * Liga a sessão aos efeitos globais: conexão Socket.IO por token e
 * encerramento da sessão quando a API responde 401 (expirada ou inválida).
 * Retorna a função de limpeza.
 */
export function startSessionSync(queryClient: QueryClient) {
  realtime.connect(getSessionToken())
  const unsubscribeToken = subscribeSessionToken((token) => {
    // Troca de usuário em outra aba também chega aqui (evento `storage`).
    if (!token) clearPrivateCache(queryClient)
    realtime.connect(token)
  })
  const unsubscribeAuth = onAuthFailure((code) => {
    endSession(queryClient, code === 'SESSION_EXPIRED' ? 'expired' : 'logout')
  })
  return () => {
    unsubscribeToken()
    unsubscribeAuth()
    realtime.disconnect()
  }
}

/** Atualiza o usuário da sessão em cache (ex.: após editar perfil ou avatar). */
export function updateSessionUser(queryClient: QueryClient, user: SessionResponse['user']) {
  const key = sessionQuery(getSessionToken()).queryKey
  queryClient.setQueryData(key, (current) => (current ? { ...current, user } : current))
}
