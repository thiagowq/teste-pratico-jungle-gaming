import type { z } from 'zod'
import { ApiError } from './errors'

/** Valida a resposta contra o contrato. Divergência vira `ApiError` em vez de dado corrompido na UI. */
export function parseResponse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  if (import.meta.env.DEV) console.error('[contrato] resposta inválida', result.error.issues)
  throw new ApiError({ code: 'UNKNOWN', message: 'Recebemos uma resposta inesperada do servidor.' })
}
