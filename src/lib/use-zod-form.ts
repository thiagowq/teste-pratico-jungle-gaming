import { useState } from 'react'
import type { z } from 'zod'
import type { ApiError } from '@/api/errors'

type Values<S extends z.ZodType> = z.input<S>
type FieldErrors = Record<string, string>

/**
 * Formulário controlado validado pelo mesmo schema zod do contrato da API.
 * - Erros aparecem após o envio e são revalidados a cada alteração.
 * - Erros por campo devolvidos pela API (422/409) entram no mesmo lugar.
 * - No envio inválido, o foco vai para o primeiro campo com erro.
 */
export function useZodForm<S extends z.ZodType>(schema: S, initial: Values<S>, formId: string) {
  const [values, setValues] = useState<Values<S>>(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const validate = (next: Values<S>) => {
    const result = schema.safeParse(next)
    if (result.success) return { data: result.data as z.output<S>, errors: {} as FieldErrors }
    const fieldErrors: FieldErrors = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || 'form'
      fieldErrors[key] ??= issue.message
    }
    return { data: null, errors: fieldErrors }
  }

  const focusFirstError = (fieldErrors: FieldErrors) => {
    const first = Object.keys(fieldErrors)[0]
    if (!first) return
    requestAnimationFrame(() => document.getElementById(`${formId}-${first}`)?.focus())
  }

  const setValue = <K extends keyof Values<S>>(key: K, value: Values<S>[K]) => {
    setValues((current) => {
      const next = { ...(current as object), [key]: value } as Values<S>
      if (submitted) setErrors(validate(next).errors)
      return next
    })
  }

  const handleSubmit = (onValid: (data: z.output<S>) => Promise<void> | void) => async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    setFormError(null)
    const { data, errors: fieldErrors } = validate(values)
    setErrors(fieldErrors)
    if (!data) {
      focusFirstError(fieldErrors)
      return
    }
    await onValid(data)
  }

  /** Aplica um erro da API: campos conhecidos vão para os campos, o resto para o topo. */
  const applyApiError = (error: ApiError) => {
    const known = Object.fromEntries(Object.entries(error.fieldErrors).filter(([key]) => key in (values as object)))
    setErrors(known)
    if (Object.keys(known).length) focusFirstError(known)
    else setFormError(error.message)
    if (Object.keys(known).length && error.code !== 'VALIDATION_ERROR') setFormError(error.message)
  }

  /** Props de acessibilidade de um campo: id, estado inválido e associação com a mensagem. */
  const field = (name: keyof Values<S> & string) => ({
    id: `${formId}-${name}`,
    name,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${formId}-${name}-error` : undefined,
  })

  /** Substitui todos os valores (ex.: preencher com dados carregados) e limpa os erros. */
  const reset = (next: Values<S>) => {
    setValues(next)
    setErrors({})
    setFormError(null)
  }

  /** Valida sem enviar: devolve os dados ou mostra os erros e foca o primeiro. */
  const validateNow = () => {
    setSubmitted(true)
    const { data, errors: fieldErrors } = validate(values)
    setErrors(fieldErrors)
    if (!data) focusFirstError(fieldErrors)
    return data
  }

  return { values, setValue, errors, formError, setFormError, handleSubmit, applyApiError, field, reset, validateNow }
}
