import { isAxiosError } from 'axios'

/**
 * Códigos de erro do contrato REST. O servidor (MSW) sempre responde erros no
 * envelope `ApiErrorBody`; falhas de transporte são mapeadas no cliente.
 */
export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'OUT_OF_STOCK',
  'PRICE_CHANGED',
  'QUOTE_EXPIRED',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'IDEMPOTENCY_CONFLICT',
  'PAYMENT_DECLINED',
  'WALLET_REJECTED',
  'TRANSIENT',
  'NETWORK',
  'TIMEOUT',
  'CANCELED',
  'UNKNOWN',
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    /** Erros por campo, chaveados pelo nome do campo no payload enviado. */
    fieldErrors?: Record<string, string>
    details?: Record<string, unknown>
  }
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number | null
  readonly fieldErrors: Record<string, string>
  readonly details: Record<string, unknown>

  constructor(params: {
    code: ApiErrorCode
    message: string
    status?: number | null
    fieldErrors?: Record<string, string>
    details?: Record<string, unknown>
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.code = params.code
    this.status = params.status ?? null
    this.fieldErrors = params.fieldErrors ?? {}
    this.details = params.details ?? {}
  }

  /** Falhas que podem ser repetidas com segurança (sem efeito colateral duplicado). */
  get isRetryable() {
    return this.code === 'TRANSIENT' || this.code === 'NETWORK' || this.code === 'TIMEOUT'
  }

  get isAuthError() {
    return this.code === 'UNAUTHENTICATED' || this.code === 'SESSION_EXPIRED'
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const error = (value as { error: unknown }).error
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string' &&
    (API_ERROR_CODES as readonly string[]).includes((error as { code: string }).code)
  )
}

/** Converte qualquer falha vinda do Axios em `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isAxiosError(error)) {
    if (error.code === 'ERR_CANCELED') {
      return new ApiError({ code: 'CANCELED', message: 'Requisição cancelada.' })
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ code: 'TIMEOUT', message: 'O servidor demorou para responder. Tente novamente.' })
    }
    if (!error.response) {
      return new ApiError({ code: 'NETWORK', message: 'Sem conexão com o servidor. Verifique sua internet.' })
    }
    const { status, data } = error.response
    if (isApiErrorBody(data)) {
      return new ApiError({ ...data.error, status })
    }
    return new ApiError({
      code: status >= 500 ? 'TRANSIENT' : 'UNKNOWN',
      message: status >= 500 ? 'Instabilidade no servidor. Tente novamente.' : 'Algo deu errado.',
      status,
    })
  }

  return new ApiError({ code: 'UNKNOWN', message: error instanceof Error ? error.message : 'Erro desconhecido.' })
}
