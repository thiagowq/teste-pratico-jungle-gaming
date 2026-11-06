import { HttpResponse, delay, type DefaultBodyType, type HttpResponseResolver, type PathParams } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/api/errors'
import { createRandom } from './random'
import { getScenario, takeFault } from './scenario'

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  extra?: { fieldErrors?: Record<string, string>; details?: Record<string, unknown> },
) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message, ...extra } }, { status })
}

let latencyRandom = createRandom(getScenario().seed)

export function reseedLatency() {
  latencyRandom = createRandom(getScenario().seed)
}

/** Latência (ms) do perfil atual. No perfil `variable` gera respostas fora de ordem. */
export function networkLatency(): number {
  switch (getScenario().network) {
    case 'instant':
      return 0
    case 'slow':
      return latencyRandom.int(1500, 2500)
    case 'variable':
      return latencyRandom.int(50, 2000)
    default:
      return latencyRandom.int(120, 350)
  }
}

/**
 * Envolve um resolver aplicando latência e falhas do cenário ativo.
 * `route` identifica a rota nas regras de falha (ex.: `POST /orders`).
 */
export function withNetwork<Params extends PathParams = PathParams>(
  route: string,
  resolver: (info: Parameters<HttpResponseResolver<Params, DefaultBodyType>>[0]) => Response | Promise<Response>,
): HttpResponseResolver<Params, DefaultBodyType> {
  return async (info) => {
    const fault = takeFault(route)
    if (fault?.kind === 'offline') return HttpResponse.error()
    if (fault?.kind === 'timeout') await delay('infinite')
    await delay(networkLatency())
    if (fault?.kind === 'http') {
      return apiError(fault.status, fault.code, fault.message ?? 'Falha simulada.')
    }
    return resolver(info)
  }
}
