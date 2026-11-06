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

export const registerRequest = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição.').max(40),
  email: z.email('Informe um e-mail válido.'),
  password,
})
export type RegisterRequest = z.infer<typeof registerRequest>
