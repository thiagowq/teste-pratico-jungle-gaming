import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import * as profileApi from '@/api/profile'
import { password, profileUpdate, type User } from '@/api/contracts/auth'
import type { ApiError } from '@/api/errors'
import { FieldError, PasswordInput } from '@/components/form-field'
import { ImagePlaceholderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { updateSessionUser, useSession } from '@/features/auth/session'
import { inputClass } from '@/lib/input-class'
import { AVATAR_ACCEPT, prepareAvatar } from '@/lib/resize-image'
import { useZodForm } from '@/lib/use-zod-form'

export const Route = createFileRoute('/_auth/conta/perfil')({
  head: () => ({ meta: [{ title: 'Perfil | Kurio' }] }),
  component: ProfilePage,
})

/** Senha é opcional no formulário: só é trocada quando algum campo de senha é preenchido. */
const passwordSection = z
  .object({ currentPassword: z.string(), newPassword: z.string(), confirmPassword: z.string() })
  .superRefine((values, ctx) => {
    const touched = values.currentPassword || values.newPassword || values.confirmPassword
    if (!touched) return
    if (!values.currentPassword)
      ctx.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Informe a senha atual.' })
    const strong = password.safeParse(values.newPassword)
    if (!strong.success)
      ctx.addIssue({ code: 'custom', path: ['newPassword'], message: strong.error.issues[0].message })
    if (values.newPassword !== values.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas não coincidem.' })
    }
  })

const label = 'flex items-center text-[15px] leading-[15px]'

function Required({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className={label}>
      {children}
      <span aria-hidden className="text-[22px] leading-none text-coral">
        *
      </span>
      <span className="sr-only"> (obrigatório)</span>
    </label>
  )
}

function ProfilePage() {
  const { user } = useSession()
  if (!user) return null
  // `key` reinicia o formulário se outro usuário entrar na mesma aba.
  return <ProfileForm key={user.id} user={user} />
}

function ProfileForm({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const profile = useZodForm(
    profileUpdate,
    {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ensName: user.ensName ?? '',
      walletNickname: user.walletNickname ?? '',
    },
    'profile',
  )
  const passwords = useZodForm(
    passwordSection,
    { currentPassword: '', newPassword: '', confirmPassword: '' },
    'profile',
  )
  const [saving, setSaving] = useState(false)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const profileData = profile.validateNow()
    const passwordData = passwords.validateNow()
    if (!profileData || !passwordData) return
    setSaving(true)
    try {
      const updated = await profileApi.updateProfile(profileData)
      updateSessionUser(queryClient, updated)
      if (passwordData.newPassword) {
        try {
          await profileApi.changePassword({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          })
          passwords.reset({ currentPassword: '', newPassword: '', confirmPassword: '' })
          toast.success('Perfil e senha atualizados.')
        } catch (error) {
          passwords.applyApiError(error as ApiError)
          toast.error('Perfil salvo, mas a senha não foi alterada.')
        }
      } else {
        toast.success('Perfil atualizado.')
      }
    } catch (error) {
      const apiError = error as ApiError
      if (!profile.applyApiError(apiError) && !apiError.isAuthError) toast.error(apiError.message)
    } finally {
      setSaving(false)
    }
  }

  const text = (name: 'displayName' | 'username' | 'email' | 'walletNickname', title: string, type = 'text') => (
    <div className="flex flex-col gap-2.5">
      <Required htmlFor={`profile-${name}`}>{title}</Required>
      <input
        {...profile.field(name)}
        type={type}
        value={profile.values[name]}
        onChange={(event) => profile.setValue(name, event.target.value)}
        className={inputClass()}
      />
      <FieldError id={`profile-${name}-error`} message={profile.errors[name]} />
    </div>
  )

  const secret = (name: 'currentPassword' | 'newPassword' | 'confirmPassword', title: string) => (
    <div className="flex flex-col gap-3 md:max-w-[417px]">
      <label htmlFor={`profile-${name}`} className={label}>
        {title}
      </label>
      <PasswordInput
        {...passwords.field(name)}
        autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
        value={passwords.values[name]}
        onChange={(event) => passwords.setValue(name, event.target.value)}
      />
      <FieldError id={`profile-${name}-error`} message={passwords.errors[name]} />
    </div>
  )

  return (
    <form noValidate onSubmit={save} aria-labelledby="profile-heading" className="flex flex-col gap-8">
      <h1 id="profile-heading" className="text-base leading-4 font-bold">
        Perfil do colecionador
      </h1>
      {profile.formError && (
        <p role="alert" className="rounded-md border border-coral/60 bg-coral/10 px-3 py-2 text-sm text-coral">
          {profile.formError}
        </p>
      )}
      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        {text('displayName', 'Nome de exibição')}
        {text('username', 'Nome de usuário')}
        {text('email', 'E-mail', 'email')}
        <div className="flex flex-col gap-2.5">
          <Required htmlFor="profile-ensName">Nome ENS</Required>
          <div className="flex gap-2.5">
            <input
              {...profile.field('ensName')}
              value={profile.values.ensName}
              onChange={(event) => profile.setValue('ensName', event.target.value)}
              className={inputClass()}
            />
            <span className="flex h-10 items-center rounded-[3px] border border-border px-3 text-[15px]">.eth</span>
          </div>
          <FieldError id="profile-ensName-error" message={profile.errors.ensName} />
        </div>
        {text('walletNickname', 'Apelido da carteira')}
        <AvatarField user={user} />
      </div>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-6 text-base leading-4 font-medium">Alterar senha</legend>
        {secret('currentPassword', 'Senha atual')}
        {secret('newPassword', 'Nova senha')}
        {secret('confirmPassword', 'Confirmar nova senha')}
      </fieldset>

      <Button type="submit" className="w-[131px] rounded-[3px]" disabled={saving} aria-busy={saving}>
        {saving ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}

function AvatarField({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const onUser = (updated: User) => updateSessionUser(queryClient, updated)

  const upload = useMutation({
    mutationFn: async (file: File) => profileApi.uploadAvatar(await prepareAvatar(file)),
    onSuccess: (updated) => {
      onUser(updated)
      setError(null)
      toast.success('Avatar atualizado.')
    },
    onError: (failure) => setError(failure.message),
  })
  const remove = useMutation({
    mutationFn: profileApi.removeAvatar,
    onSuccess: (updated) => {
      onUser(updated)
      toast.success('Avatar removido.')
    },
    onError: (failure) => toast.error(failure.message),
  })
  const busy = upload.isPending || remove.isPending

  return (
    <div className="flex flex-col gap-2.5">
      <span id="avatar-label" className={label}>
        Avatar
      </span>
      <div className="flex items-center gap-6" aria-labelledby="avatar-label" role="group">
        <span className="grid size-[50px] shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-raised">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={`Avatar de ${user.displayName}`} className="size-full object-cover" />
          ) : (
            <ImagePlaceholderIcon aria-hidden />
          )}
        </span>
        <input
          ref={input}
          type="file"
          accept={AVATAR_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) upload.mutate(file)
          }}
        />
        <Button
          type="button"
          className="h-10 w-[98px] rounded-[3px]"
          onClick={() => input.current?.click()}
          disabled={busy}
          aria-busy={upload.isPending}
          aria-describedby={error ? 'avatar-error' : undefined}
        >
          {upload.isPending ? 'Enviando…' : 'Alterar'}
        </Button>
        <button
          type="button"
          onClick={() => remove.mutate()}
          disabled={busy || !user.avatarUrl}
          className="text-sm hover:text-brand-accent disabled:opacity-40"
        >
          Remover
        </button>
      </div>
      {error && (
        <p id="avatar-error" role="alert" className="text-[13px] text-coral">
          {error}
        </p>
      )}
    </div>
  )
}
