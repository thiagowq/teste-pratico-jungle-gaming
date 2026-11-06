import { HttpResponse, http } from 'msw'
import { loginRequest, registerRequest, type AuthResponse, type SessionResponse } from '@/api/contracts/auth'
import { db } from '../db'
import { createSession, hashPassword, randomToken, requireSession, toPublicUser, tokenFrom } from '../lib/auth'
import { apiError, withNetwork } from '../lib/respond'
import { fieldErrorsFrom, readJson } from '../lib/validation'

const API = '/api'

export const authHandlers = [
  http.post(
    `${API}/auth/register`,
    withNetwork('POST /auth/register', async ({ request }) => {
      const parsed = registerRequest.safeParse(await readJson(request))
      if (!parsed.success) {
        return apiError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', { fieldErrors: fieldErrorsFrom(parsed.error) })
      }
      const { displayName, email, password } = parsed.data
      const normalizedEmail = email.toLowerCase()
      const exists = Object.values(db.get().users).some((user) => user.email.toLowerCase() === normalizedEmail)
      if (exists) {
        return apiError(409, 'CONFLICT', 'Já existe uma conta com este e-mail.', {
          fieldErrors: { email: 'Este e-mail já está cadastrado. Entre ou use outro e-mail.' },
        })
      }
      const salt = randomToken('salt')
      const id = randomToken('user')
      const user = {
        id,
        displayName,
        username: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        ensName: null,
        walletNickname: null,
        avatarUrl: null,
        passwordSalt: salt,
        passwordHash: await hashPassword(salt, password),
      }
      db.update((draft) => {
        draft.users[id] = user
      })
      return HttpResponse.json<AuthResponse>({ user: toPublicUser(user), session: createSession(id) }, { status: 201 })
    }),
  ),

  http.post(
    `${API}/auth/login`,
    withNetwork('POST /auth/login', async ({ request }) => {
      const parsed = loginRequest.safeParse(await readJson(request))
      if (!parsed.success) {
        return apiError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', { fieldErrors: fieldErrorsFrom(parsed.error) })
      }
      const email = parsed.data.email.toLowerCase()
      const user = Object.values(db.get().users).find((candidate) => candidate.email.toLowerCase() === email)
      const valid = user && (await hashPassword(user.passwordSalt, parsed.data.password)) === user.passwordHash
      if (!user || !valid) {
        // Mensagem única para não revelar quais e-mails existem.
        return apiError(401, 'UNAUTHENTICATED', 'E-mail ou senha incorretos.')
      }
      return HttpResponse.json<AuthResponse>({ user: toPublicUser(user), session: createSession(user.id) })
    }),
  ),

  http.get(
    `${API}/auth/session`,
    withNetwork('GET /auth/session', ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      return HttpResponse.json<SessionResponse>({ user: toPublicUser(session.user), expiresAt: session.expiresAt })
    }),
  ),

  http.post(
    `${API}/auth/logout`,
    withNetwork('POST /auth/logout', ({ request }) => {
      const token = tokenFrom(request)
      // Logout é idempotente: sessão já inválida também responde 204.
      if (token) {
        db.update((draft) => {
          delete draft.sessions[token]
        })
      }
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
