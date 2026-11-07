import { z } from 'zod'
import { isoDate } from './common'

export const user = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.email(),
  ensName: z.string().nullable(),
  walletNickname: z.string().nullable(),
  /** Data URL ou caminho público do avatar. */
  avatarUrl: z.string().nullable(),
})
export type User = z.infer<typeof user>

export const session = z.object({
  token: z.string(),
  expiresAt: isoDate,
})
export type Session = z.infer<typeof session>

export const authResponse = z.object({ user, session })
export type AuthResponse = z.infer<typeof authResponse>

export const sessionResponse = z.object({ user, expiresAt: isoDate })
export type SessionResponse = z.infer<typeof sessionResponse>

/* ---------- Requisições (também usadas na validação dos formulários) ---------- */

const PASSWORD_RULE = 'A senha precisa de 8+ caracteres, com letra maiúscula, minúscula e número.'
export const password = z
  .string()
  .min(8, PASSWORD_RULE)
  .regex(/[a-z]/, PASSWORD_RULE)
  .regex(/[A-Z]/, PASSWORD_RULE)
  .regex(/\d/, PASSWORD_RULE)

export const loginRequest = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})
export type LoginRequest = z.infer<typeof loginRequest>

export const username = z
  .string()
  .trim()
  .min(3, 'O nome de usuário precisa de pelo menos 3 caracteres.')
  .max(20, 'O nome de usuário pode ter até 20 caracteres.')
  .regex(/^[a-z0-9._]+$/, 'Use apenas letras minúsculas, números, ponto e sublinhado.')

export const registerRequest = z.object({
  username,
  email: z.email('Informe um e-mail válido.'),
  password,
})
export type RegisterRequest = z.infer<typeof registerRequest>

/* ---------- Perfil ---------- */

export const profileUpdate = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição.').max(40, 'Use até 40 caracteres.'),
  username,
  email: z.email('Informe um e-mail válido.'),
  ensName: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,32}$/, 'Use de 3 a 32 letras minúsculas, números ou hífen.'),
  walletNickname: z.string().trim().min(2, 'Informe o apelido da carteira.').max(30, 'Use até 30 caracteres.'),
})
export type ProfileUpdate = z.infer<typeof profileUpdate>

export const changePasswordRequest = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: password,
})
export type ChangePasswordRequest = z.infer<typeof changePasswordRequest>

/** Avatar enviado como data URL de imagem (já redimensionada no cliente). */
export const avatarRequest = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Formato de imagem inválido. Use PNG, JPEG ou WebP.')
    .max(400_000, 'A imagem é muito grande.'),
})

export const profileResponse = z.object({ user })
