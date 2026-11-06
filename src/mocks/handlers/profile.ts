import { HttpResponse, http } from 'msw'
import { avatarRequest, changePasswordRequest, profileUpdate } from '@/api/contracts/auth'
import { db } from '../db'
import { hashPassword, randomToken, requireSession, toPublicUser } from '../lib/auth'
import { apiError, withNetwork } from '../lib/respond'
import { fieldErrorsFrom, readJson } from '../lib/validation'

const API = '/api'

export const profileHandlers = [
  http.get(
    `${API}/me/profile`,
    withNetwork('GET /me/profile', ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      return HttpResponse.json({ user: toPublicUser(session.user) })
    }),
  ),

  http.patch(
    `${API}/me/profile`,
    withNetwork('PATCH /me/profile', async ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      const parsed = profileUpdate.safeParse(await readJson(request))
      if (!parsed.success) {
        return apiError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', {
          fieldErrors: fieldErrorsFrom(parsed.error),
        })
      }
      const others = Object.values(db.get().users).filter((user) => user.id !== session.user.id)
      const fieldErrors: Record<string, string> = {}
      if (others.some((user) => user.email.toLowerCase() === parsed.data.email.toLowerCase())) {
        fieldErrors.email = 'Este e-mail já está em uso por outra conta.'
      }
      if (others.some((user) => user.username === parsed.data.username)) {
        fieldErrors.username = 'Este nome de usuário já está em uso.'
      }
      if (Object.keys(fieldErrors).length) {
        return apiError(409, 'CONFLICT', 'Alguns dados já estão em uso.', { fieldErrors })
      }
      const next = db.update((draft) => {
        Object.assign(draft.users[session.user.id], { ...parsed.data, email: parsed.data.email.toLowerCase() })
      })
      return HttpResponse.json({ user: toPublicUser(next.users[session.user.id]) })
    }),
  ),

  http.put(
    `${API}/me/avatar`,
    withNetwork('PUT /me/avatar', async ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      const parsed = avatarRequest.safeParse(await readJson(request))
      if (!parsed.success) {
        return apiError(422, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Imagem inválida.', {
          fieldErrors: { avatar: parsed.error.issues[0]?.message ?? 'Imagem inválida.' },
        })
      }
      const next = db.update((draft) => {
        draft.users[session.user.id].avatarUrl = parsed.data.dataUrl
      })
      return HttpResponse.json({ user: toPublicUser(next.users[session.user.id]) })
    }),
  ),

  http.delete(
    `${API}/me/avatar`,
    withNetwork('DELETE /me/avatar', ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      const next = db.update((draft) => {
        draft.users[session.user.id].avatarUrl = null
      })
      return HttpResponse.json({ user: toPublicUser(next.users[session.user.id]) })
    }),
  ),

  /** Troca de senha: exige a atual e grava apenas o novo hash com um novo salt. */
  http.post(
    `${API}/me/password`,
    withNetwork('POST /me/password', async ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      const parsed = changePasswordRequest.safeParse(await readJson(request))
      if (!parsed.success) {
        return apiError(422, 'VALIDATION_ERROR', 'Revise os campos de senha.', {
          fieldErrors: fieldErrorsFrom(parsed.error),
        })
      }
      const user = session.user
      if ((await hashPassword(user.passwordSalt, parsed.data.currentPassword)) !== user.passwordHash) {
        return apiError(422, 'VALIDATION_ERROR', 'A senha atual está incorreta.', {
          fieldErrors: { currentPassword: 'A senha atual está incorreta.' },
        })
      }
      if (parsed.data.currentPassword === parsed.data.newPassword) {
        return apiError(422, 'VALIDATION_ERROR', 'A nova senha precisa ser diferente da atual.', {
          fieldErrors: { newPassword: 'A nova senha precisa ser diferente da atual.' },
        })
      }
      const salt = randomToken('salt')
      const passwordHash = await hashPassword(salt, parsed.data.newPassword)
      db.update((draft) => {
        draft.users[user.id].passwordSalt = salt
        draft.users[user.id].passwordHash = passwordHash
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
