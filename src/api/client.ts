import axios from 'axios'
import { toApiError } from './errors'
import { getSessionToken } from './session-token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getSessionToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

type AuthFailureListener = (code: 'UNAUTHENTICATED' | 'SESSION_EXPIRED') => void
const authFailureListeners = new Set<AuthFailureListener>()

/** Avisado quando uma requisição autenticada é rejeitada (sessão inválida/expirada). */
export function onAuthFailure(listener: AuthFailureListener) {
  authFailureListeners.add(listener)
  return () => {
    authFailureListeners.delete(listener)
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    // Só trata como queda de sessão se a requisição foi feita com um token.
    if (apiError.isAuthError && getSessionToken()) {
      authFailureListeners.forEach((listener) => listener(apiError.code as 'UNAUTHENTICATED' | 'SESSION_EXPIRED'))
    }
    return Promise.reject(apiError)
  },
)
