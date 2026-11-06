import { toast } from 'sonner'
import { NETWORKS, NETWORK_LABELS } from '@/api/contracts/common'
import {
  WALLET_TYPES,
  WALLET_TYPE_LABELS,
  walletInput,
  type WalletInput,
  type WalletSlot,
} from '@/api/contracts/wallets'
import type { ApiError } from '@/api/errors'
import { FieldError } from '@/components/form-field'
import { ChevronDownIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { inputClass } from '@/lib/input-class'
import { cn } from '@/lib/utils'
import { useZodForm } from '@/lib/use-zod-form'
import { useRemoveWallet, useSaveWallet } from './use-wallets'

function Required({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="flex h-[29px] items-center text-[15px] leading-[15px]">
      {children}
      <span aria-hidden className="text-[22px] text-coral">
        *
      </span>
      <span className="sr-only"> (obrigatório)</span>
    </label>
  )
}

/** Formulário de carteira (principal ou secundária) com os campos do frame "Carteiras". */
export function WalletForm({
  slot,
  initial,
  onSaved,
}: {
  slot: WalletSlot
  initial: WalletInput
  onSaved?: () => void
}) {
  const id = `wallet-${slot}`
  const form = useZodForm(walletInput, initial, id)
  const save = useSaveWallet()
  const remove = useRemoveWallet()

  const text = (
    name: 'displayName' | 'nickname' | 'profileName' | 'address' | 'referralCode' | 'email',
    title: string,
    extra: { placeholder?: string; type?: string } = {},
  ) => (
    <div>
      <Required htmlFor={`${id}-${name}`}>{title}</Required>
      <input
        {...form.field(name)}
        type={extra.type ?? 'text'}
        placeholder={extra.placeholder}
        value={form.values[name]}
        onChange={(event) => form.setValue(name, event.target.value)}
        className={cn(inputClass(), 'rounded-[3px]')}
      />
      <FieldError id={`${id}-${name}-error`} message={form.errors[name]} />
    </div>
  )

  const select = <T extends string>(
    name: 'network' | 'walletType',
    title: string,
    options: readonly T[],
    labels: Record<T, string>,
  ) => (
    <div>
      <Required htmlFor={`${id}-${name}`}>{title}</Required>
      <div className="relative">
        <select
          {...form.field(name)}
          value={form.values[name]}
          onChange={(event) => form.setValue(name, event.target.value as never)}
          className={cn(inputClass(), 'appearance-none rounded-[3px] pr-10')}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {labels[option]}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2"
        />
      </div>
      <FieldError id={`${id}-${name}-error`} message={form.errors[name]} />
    </div>
  )

  return (
    <form
      noValidate
      aria-label={slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'}
      onSubmit={form.handleSubmit(async (input) => {
        try {
          await save.mutateAsync({ slot, input })
          toast.success(slot === 'primary' ? 'Carteira principal salva.' : 'Carteira secundária salva.')
          onSaved?.()
        } catch (error) {
          const apiError = error as ApiError
          form.applyApiError(apiError)
          if (!apiError.isAuthError) toast.error(apiError.message)
        }
      })}
      className="flex flex-col gap-6"
    >
      {form.formError && (
        <p role="alert" className="rounded-md border border-coral/60 bg-coral/10 px-3 py-2 text-sm text-coral">
          {form.formError}
        </p>
      )}
      <div className="grid gap-x-7 gap-y-3 md:grid-cols-2">
        {text('displayName', 'Nome de exibição')}
        {text('nickname', 'Apelido da carteira')}
        {select('network', 'Rede', NETWORKS, NETWORK_LABELS)}
        {text('profileName', 'Nome do perfil')}
        {text('address', 'Endereço da carteira', { placeholder: 'Endereço 0x da carteira' })}
        <div>
          <span className="block h-[29px]" aria-hidden />
          <input
            {...form.field('ensSecondary')}
            aria-label="ENS ou carteira secundária (opcional)"
            placeholder="ENS ou carteira secundária (opcional)"
            value={form.values.ensSecondary}
            onChange={(event) => form.setValue('ensSecondary', event.target.value)}
            className={cn(inputClass(), 'rounded-[3px]')}
          />
          <FieldError id={`${id}-ensSecondary-error`} message={form.errors.ensSecondary} />
        </div>
        {select('walletType', 'Tipo de carteira', WALLET_TYPES, WALLET_TYPE_LABELS)}
        {text('referralCode', 'Código de indicação')}
        {text('email', 'E-mail', { type: 'email' })}
        <div>
          <Required htmlFor={`${id}-ensName`}>Nome ENS</Required>
          <div className="flex gap-2.5">
            <input
              {...form.field('ensName')}
              value={form.values.ensName}
              onChange={(event) => form.setValue('ensName', event.target.value)}
              className={cn(inputClass(), 'rounded-[3px]')}
            />
            <span className="flex h-10 items-center rounded-[3px] border border-border px-3 text-[15px]">.eth</span>
          </div>
          <FieldError id={`${id}-ensName-error`} message={form.errors.ensName} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          className="h-10 w-[131px] rounded-[3px] px-0"
          disabled={save.isPending}
          aria-busy={save.isPending}
        >
          {save.isPending ? 'Salvando…' : 'Salvar carteira'}
        </Button>
        {slot === 'secondary' && (
          <Button
            type="button"
            variant="ghost"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate('secondary', {
                onSuccess: () => toast.success('Carteira secundária removida.'),
                onError: (error) => toast.error((error as ApiError).message),
              })
            }
          >
            Remover carteira secundária
          </Button>
        )}
      </div>
    </form>
  )
}
