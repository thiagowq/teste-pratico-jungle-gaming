import type { BuyerForm } from '@/api/contracts/checkout'
import { NETWORKS, NETWORK_LABELS, type Network } from '@/api/contracts/common'
import { WALLET_TYPES, WALLET_TYPE_LABELS, type WalletType } from '@/api/contracts/wallets'
import { FieldError } from '@/components/form-field'
import { ChevronDownIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { useZodForm } from '@/lib/use-zod-form'
import type { buyerForm } from '@/api/contracts/checkout'

type Form = ReturnType<typeof useZodForm<typeof buyerForm>>

const field =
  'h-10 w-full rounded-[3px] border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-tan focus:border-brand focus:outline-none aria-invalid:border-coral'

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="flex h-[29px] items-center text-[15px] leading-[15px]">
      {children}
      {required && (
        <span aria-hidden className="text-[22px] text-coral">
          *
        </span>
      )}
      {required && <span className="sr-only"> (obrigatório)</span>}
    </label>
  )
}

function Select<T extends string>({
  form,
  name,
  options,
  labels,
  placeholder,
  disabled,
}: {
  form: Form
  name: 'network' | 'walletType'
  options: readonly T[]
  labels: Record<T, string>
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        {...form.field(name)}
        value={form.values[name]}
        disabled={disabled}
        onChange={(event) => form.setValue(name, event.target.value as never)}
        className={cn(field, 'appearance-none pr-10 disabled:opacity-60')}
      >
        <option value="" disabled>
          {placeholder}
        </option>
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
  )
}

/**
 * "Perfil do colecionador" do Figma: dados do comprador e da carteira de
 * origem. Os campos com * são obrigatórios, como no layout.
 */
export function BuyerFields({ form, lockWallet }: { form: Form; lockWallet: boolean }) {
  const text = (
    name: Exclude<keyof BuyerForm, 'network' | 'walletType' | 'note'>,
    label: string,
    options: {
      required?: boolean
      placeholder?: string
      type?: string
      autoComplete?: string
      readOnly?: boolean
    } = {},
  ) => (
    <div>
      <Label htmlFor={`checkout-${name}`} required={options.required}>
        {label}
      </Label>
      <input
        {...form.field(name)}
        type={options.type ?? 'text'}
        autoComplete={options.autoComplete ?? 'off'}
        placeholder={options.placeholder}
        readOnly={options.readOnly}
        value={form.values[name]}
        onChange={(event) => form.setValue(name, event.target.value)}
        className={cn(field, options.readOnly && 'text-text-secondary')}
      />
      <FieldError id={`checkout-${name}-error`} message={form.errors[name]} />
    </div>
  )

  return (
    <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
      {text('displayName', 'Nome de exibição', { required: true, autoComplete: 'name' })}
      {text('username', 'Nome de usuário', { required: true, autoComplete: 'username' })}
      <div>
        <Label htmlFor="checkout-network" required>
          Rede
        </Label>
        <Select<Network>
          form={form}
          name="network"
          options={NETWORKS}
          labels={NETWORK_LABELS}
          placeholder="Selecione uma rede"
        />
        <FieldError id="checkout-network-error" message={form.errors.network} />
      </div>
      {text('profileName', 'Nome do perfil', { required: true })}
      {text('address', 'Endereço da carteira', {
        required: true,
        placeholder: 'Endereço 0x da carteira',
        readOnly: lockWallet,
      })}
      <div>
        <Label htmlFor="checkout-ensSecondary">
          <span className="sr-only">ENS ou carteira secundária (opcional)</span>
        </Label>
        <input
          {...form.field('ensSecondary')}
          aria-label="ENS ou carteira secundária (opcional)"
          placeholder="ENS ou carteira secundária (opcional)"
          value={form.values.ensSecondary}
          onChange={(event) => form.setValue('ensSecondary', event.target.value)}
          className={field}
        />
        <FieldError id="checkout-ensSecondary-error" message={form.errors.ensSecondary} />
      </div>
      <div>
        <Label htmlFor="checkout-walletType" required>
          Tipo de carteira
        </Label>
        <Select<WalletType>
          form={form}
          name="walletType"
          options={WALLET_TYPES}
          labels={WALLET_TYPE_LABELS}
          placeholder="Selecione uma carteira"
          disabled={lockWallet}
        />
        <FieldError id="checkout-walletType-error" message={form.errors.walletType} />
      </div>
      {text('referralCode', 'Código de indicação', { required: true })}
      {text('email', 'E-mail', { required: true, type: 'email', autoComplete: 'email' })}
      <div>
        <Label htmlFor="checkout-ensName" required>
          Nome ENS
        </Label>
        <div className="flex items-center gap-2">
          <input
            {...form.field('ensName')}
            value={form.values.ensName}
            onChange={(event) => form.setValue('ensName', event.target.value)}
            className={cn(field, 'max-w-[220px]')}
          />
          <span className="flex h-10 items-center rounded-[3px] border border-border px-3 text-[15px]">.eth</span>
        </div>
        <FieldError id="checkout-ensName-error" message={form.errors.ensName} />
      </div>
    </div>
  )
}

export function NoteField({ form }: { form: Form }) {
  return (
    <div className="flex max-w-[350px] flex-col gap-3">
      <label htmlFor="checkout-note" className="text-[15px] leading-[15px]">
        Observação do colecionador (opcional)
      </label>
      <textarea
        {...form.field('note')}
        rows={6}
        maxLength={280}
        value={form.values.note}
        onChange={(event) => form.setValue('note', event.target.value)}
        className="h-[152px] resize-none rounded-[3px] border border-border bg-transparent p-3 text-sm focus:border-brand focus:outline-none"
      />
      <FieldError id="checkout-note-error" message={form.errors.note} />
    </div>
  )
}
