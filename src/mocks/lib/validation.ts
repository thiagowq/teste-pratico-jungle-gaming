import type { ZodError } from 'zod'

/** Lê o corpo JSON sem lançar: corpo inválido vira `undefined` e falha na validação. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}

/** Converte erros do zod em `{ campo: mensagem }` (primeira mensagem por campo). */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    fieldErrors[key] ??= issue.message
  }
  return fieldErrors
}
