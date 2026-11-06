import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import * as authApi from '@/api/auth'
import { loginRequest, registerRequest } from '@/api/contracts/auth'
import type { ApiError } from '@/api/errors'
import { FieldError, PasswordInput } from '@/components/form-field'
import { inputClass } from '@/lib/input-class'
import { FacebookIcon, GoogleIcon } from '@/components/icons'
import { mergeGuestCartAfterLogin } from '@/features/cart/use-cart'
import { useZodForm } from '@/lib/use-zod-form'
import { cn } from '@/lib/utils'
import { safeRedirect } from './safe-redirect'
import { clearSessionEndReason, startSession, useSessionEndReason } from './session'

export type AuthMode = 'login' | 'register'

const registerForm = registerRequest
  .extend({ confirmPassword: z.string().min(1, 'Confirme sua senha.') })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })

/** Após autenticar: inicia a sessão, leva o carrinho do visitante e volta ao fluxo anterior. */
function useCompleteAuth(redirect: string | undefined) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return async (response: Awaited<ReturnType<typeof authApi.login>>, message: string) => {
    startSession(queryClient, response)
    await mergeGuestCartAfterLogin(queryClient, response.user.id)
    toast.success(message)
    void navigate({ href: safeRedirect(redirect) })
  }
}

function unavailable(feature: string) {
  toast.info(`${feature} não está disponível nesta demonstração. Use e-mail e senha.`)
}

function SocialButtons({ size }: { size: 'md' | 'lg' }) {
  const button = cn(
    'flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] leading-4 font-medium text-text-secondary transition-colors hover:border-brand',
    size === 'lg' && 'max-md:h-10',
  )
  return (
    <div className="flex flex-col gap-3 md:gap-3">
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-[13px] leading-4">Ou continue com</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <button type="button" className={button} onClick={() => unavailable('O login com Google')}>
        <GoogleIcon aria-hidden />
        Continuar com Google
      </button>
      <button type="button" className={button} onClick={() => unavailable('O login com Facebook')}>
        <FacebookIcon aria-hidden />
        Continuar com Facebook
      </button>
    </div>
  )
}

function FormAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md border border-coral/60 bg-coral/10 px-3 py-2 text-sm text-coral">
      {message}
    </p>
  )
}

function LoginForm({ redirect, size }: { redirect?: string; size: 'md' | 'lg' }) {
  const form = useZodForm(loginRequest, { email: '', password: '' }, 'login')
  const complete = useCompleteAuth(redirect)
  const mutation = useMutation({ mutationFn: authApi.login })

  return (
    <form
      noValidate
      aria-labelledby="auth-title"
      onSubmit={form.handleSubmit(async (data) => {
        try {
          const response = await mutation.mutateAsync(data)
          await complete(response, `Olá, ${response.user.displayName.split(' ')[0]}!`)
        } catch (error) {
          form.applyApiError(error as ApiError)
        }
      })}
      className="flex flex-col gap-3"
    >
      <FormAlert message={form.formError} />
      <div>
        <label htmlFor="login-email" className="sr-only">
          E-mail
        </label>
        <input
          {...form.field('email')}
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          value={form.values.email}
          onChange={(event) => form.setValue('email', event.target.value)}
          className={inputClass(size)}
        />
        <FieldError id="login-email-error" message={form.errors.email} />
      </div>
      <div>
        <label htmlFor="login-password" className="sr-only">
          Senha
        </label>
        <PasswordInput
          {...form.field('password')}
          size={size}
          autoComplete="current-password"
          placeholder="Senha"
          value={form.values.password}
          onChange={(event) => form.setValue('password', event.target.value)}
        />
        <FieldError id="login-password-error" message={form.errors.password} />
      </div>
      <button
        type="button"
        onClick={() => unavailable('A recuperação de senha')}
        className="self-end text-sm leading-4 text-brand-accent hover:underline"
      >
        Esqueceu a senha?
      </button>
      <button
        type="submit"
        disabled={mutation.isPending}
        aria-busy={mutation.isPending}
        className={cn(
          'mt-3 h-[45px] rounded-[5px] bg-brand text-base font-bold text-ink hover:brightness-110 disabled:opacity-60',
          size === 'lg' && 'mt-7 h-15 rounded-[10px]',
        )}
      >
        {mutation.isPending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}

function RegisterForm({ redirect, size }: { redirect?: string; size: 'md' | 'lg' }) {
  const form = useZodForm(registerForm, { username: '', email: '', password: '', confirmPassword: '' }, 'register')
  const complete = useCompleteAuth(redirect)
  const mutation = useMutation({ mutationFn: authApi.register })

  const text = (name: 'username' | 'email', label: string, props: React.ComponentProps<'input'>) => (
    <div>
      <label htmlFor={`register-${name}`} className="sr-only">
        {label}
      </label>
      <input
        {...form.field(name)}
        {...props}
        placeholder={label}
        value={form.values[name]}
        onChange={(event) => form.setValue(name, event.target.value)}
        className={inputClass(size)}
      />
      <FieldError id={`register-${name}-error`} message={form.errors[name]} />
    </div>
  )

  const password = (name: 'password' | 'confirmPassword', label: string, hint?: string) => (
    <div>
      <label htmlFor={`register-${name}`} className="sr-only">
        {label}
      </label>
      <PasswordInput
        {...form.field(name)}
        size={size}
        autoComplete="new-password"
        placeholder={label}
        value={form.values[name]}
        onChange={(event) => form.setValue(name, event.target.value)}
      />
      {hint && !form.errors[name] && <p className="mt-1.5 text-xs text-text-secondary">{hint}</p>}
      <FieldError id={`register-${name}-error`} message={form.errors[name]} />
    </div>
  )

  return (
    <form
      noValidate
      aria-labelledby="auth-title"
      onSubmit={form.handleSubmit(async ({ username, email, password: secret }) => {
        try {
          const response = await mutation.mutateAsync({ username, email, password: secret })
          await complete(response, 'Conta criada! Bem-vindo à Kurio.')
        } catch (error) {
          form.applyApiError(error as ApiError)
        }
      })}
      className="flex flex-col gap-3"
    >
      <FormAlert message={form.formError} />
      {text('username', 'Nome de usuário', { autoComplete: 'username', autoCapitalize: 'none', spellCheck: false })}
      {text('email', 'Digite seu e-mail', { type: 'email', autoComplete: 'email' })}
      {password('password', 'Senha', 'Mínimo de 8 caracteres, com maiúscula, minúscula e número.')}
      {password('confirmPassword', 'Confirmar senha')}
      <button
        type="submit"
        disabled={mutation.isPending}
        aria-busy={mutation.isPending}
        className={cn(
          'mt-3 h-[45px] rounded-[5px] bg-brand text-base font-bold text-ink hover:brightness-110 disabled:opacity-60',
          size === 'lg' && 'mt-7 h-15 rounded-[10px]',
        )}
      >
        {mutation.isPending ? 'Criando conta…' : 'Criar conta'}
      </button>
    </form>
  )
}

/** Conteúdo de login/cadastro. `variant="dialog"` (desktop) ou `"page"` (mobile). */
export function AuthPanel({
  mode,
  redirect,
  variant,
}: {
  mode: AuthMode
  redirect?: string
  variant: 'dialog' | 'page'
}) {
  const size = variant === 'page' ? 'lg' : 'md'
  const endReason = useSessionEndReason()
  const description =
    mode === 'login'
      ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
      : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'

  return (
    <div className={cn('flex flex-col', variant === 'dialog' ? 'gap-6 px-20 pt-12 pb-[60px]' : 'gap-8')}>
      <div className="flex flex-col items-center gap-6 md:gap-10">
        {variant === 'page' ? (
          <h1 id="auth-title" className="text-xl leading-4 font-bold">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
        ) : (
          <nav aria-label="Entrar ou criar conta" className="flex items-center gap-2 text-xl leading-4 font-medium">
            <h2 id="auth-title" className="sr-only">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </h2>
            <Link
              to="/entrar"
              search={{ redirect }}
              aria-current={mode === 'login' ? 'page' : undefined}
              className={mode === 'login' ? 'text-brand-accent' : 'hover:text-brand-accent'}
            >
              Entrar
            </Link>
            <span aria-hidden className="h-5 w-px bg-coral" />
            <Link
              to="/cadastro"
              search={{ redirect }}
              aria-current={mode === 'register' ? 'page' : undefined}
              className={mode === 'register' ? 'text-brand-accent' : 'hover:text-brand-accent'}
            >
              Criar conta
            </Link>
          </nav>
        )}
        {variant === 'dialog' && <p className="px-0 text-center text-[13px] leading-4">{description}</p>}
      </div>

      {endReason === 'expired' && (
        <p role="status" className="rounded-md border border-amber/60 bg-amber/10 px-3 py-2 text-sm text-amber">
          Sua sessão expirou. Entre novamente para continuar de onde parou.{' '}
          <button type="button" className="underline" onClick={clearSessionEndReason}>
            Fechar aviso
          </button>
        </p>
      )}

      {mode === 'login' ? (
        <LoginForm redirect={redirect} size={size} />
      ) : (
        <RegisterForm redirect={redirect} size={size} />
      )}
      <SocialButtons size={size} />

      {variant === 'page' && (
        <p className="text-center text-[15px] leading-5 text-text-secondary">
          {mode === 'login' ? (
            <>
              Novo na Kurio?{' '}
              <Link to="/cadastro" search={{ redirect }} className="text-brand-accent hover:underline">
                Crie uma conta
              </Link>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <Link to="/entrar" search={{ redirect }} className="text-brand-accent hover:underline">
                Entre
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  )
}
