import type { User } from '@/api/contracts/auth'
import type { UserRecord } from '../fixtures/users'
import { db } from '../db'
import { apiError } from './respond'

/** Duração da sessão simulada. Expiração pode ser forçada por `window.__mocks.expireSessions()`. */
export const SESSION_TTL_MS = 30 * 60_000

export async function hashPassword(salt: string, password: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function randomToken(prefix: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return `${prefix}_${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export function toPublicUser(record: UserRecord): User {
  return {
    id: record.id,
    displayName: record.displayName,
    username: record.username,
    email: record.email,
    ensName: record.ensName,
    walletNickname: record.walletNickname,
    avatarUrl: record.avatarUrl,
  }
}

export function createSession(userId: string) {
  const token = randomToken('sess')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  db.update((draft) => {
    draft.sessions[token] = { userId, expiresAt }
  })
  return { token, expiresAt }
}

function bearer(request: Request) {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

type SessionLookup =
  | { ok: true; token: string; user: UserRecord; expiresAt: string }
  | { ok: false; reason: 'missing' | 'invalid' | 'expired' }

export function lookupSession(token: string | null): SessionLookup {
  if (!token) return { ok: false, reason: 'missing' }
  const state = db.get()
  const session = state.sessions[token]
  if (!session) return { ok: false, reason: 'invalid' }
  if (Date.parse(session.expiresAt) <= Date.now()) return { ok: false, reason: 'expired' }
  const user = state.users[session.userId]
  if (!user) return { ok: false, reason: 'invalid' }
  return { ok: true, token, user, expiresAt: session.expiresAt }
}

/** Resolve o usuário autenticado ou devolve a resposta de erro adequada. */
export function requireSession(request: Request) {
  const result = lookupSession(bearer(request))
  if (result.ok) return result
  const response =
    result.reason === 'expired'
      ? apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
      : apiError(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.')
  return { ok: false as const, response }
}

export function tokenFrom(request: Request) {
  return bearer(request)
}
