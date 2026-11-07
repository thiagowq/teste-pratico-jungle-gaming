import { useState } from 'react'
import { toast } from 'sonner'
import Decimal from 'decimal.js'
import { applyCouponRequest, type Cart } from '@/api/contracts/cart'
import type { ApiError } from '@/api/errors'
import { formatEth } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useApplyCoupon, useRemoveCoupon } from './use-cart'

/** Linhas de valores vindas do servidor (subtotal, desconto, taxa e total). */
export function SummaryLines({ cart, size = 'lg' }: { cart: Cart; size?: 'lg' | 'md' }) {
  const { summary } = cart
  const value = size === 'lg' ? 'text-lg leading-4' : 'text-base leading-4'
  const hasDiscount = new Decimal(summary.discountEth).gt(0)
  return (
    <dl className="flex flex-col gap-3 text-[15px] leading-5">
      <div className="flex items-center justify-between">
        <dt>Subtotal</dt>
        <dd className={value}>{formatEth(summary.subtotalEth)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt>Desconto do lançamento</dt>
        <dd className={cn(hasDiscount && 'text-success')}>
          (-) {hasDiscount ? formatEth(summary.discountEth) : '0.00'}
        </dd>
      </div>
      <div className="flex items-start justify-between">
        <dt>Taxa de rede</dt>
        <dd className="flex flex-col items-end gap-1">
          <span className={value}>{formatEth(summary.networkFeeEth)}</span>
          <span className="text-xs leading-4 text-brand-accent">Taxa estimada</span>
        </dd>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <dt className="text-base leading-4 font-bold">Total</dt>
        <dd className="text-lg leading-4 font-bold text-brand-accent">{formatEth(summary.totalEth)}</dd>
      </div>
    </dl>
  )
}

/** Campo de cupom com aplicação, remoção e erros de código inválido/expirado. */
export function CouponForm({ cart, variant }: { cart: Cart; variant: 'desktop' | 'mobile' }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputId = `coupon-${variant}`

  if (cart.coupon) {
    const eligible = cart.coupon.status === 'applied'
    return (
      <div className="flex flex-col gap-1" aria-live="polite">
        <div className="flex items-center justify-between gap-3 rounded-[3px] border border-brand px-3 py-2 text-sm">
          <span>
            <span className={cn('font-bold', eligible ? 'text-success' : 'text-amber')}>{cart.coupon.code}</span>{' '}
            {eligible ? 'aplicado' : 'não aplicado'}
          </span>
          <button
            type="button"
            onClick={() =>
              remove.mutate(undefined, { onError: (removeError) => toast.error((removeError as ApiError).message) })
            }
            disabled={remove.isPending}
            className="text-brand-accent hover:underline disabled:opacity-50"
          >
            Remover cupom
          </button>
        </div>
        <p className={cn('text-xs', eligible ? 'text-text-secondary' : 'text-amber')}>
          {cart.coupon.message ?? cart.coupon.description}
        </p>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const parsed = applyCouponRequest.safeParse({ code })
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Código inválido.')
          return
        }
        setError(null)
        apply.mutate(parsed.data.code, {
          onSuccess: (next) => {
            setCode('')
            toast.success(`Cupom ${next.coupon?.code} aplicado.`)
          },
          onError: (applyError) => setError((applyError as ApiError).message),
        })
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor={inputId} className={variant === 'desktop' ? 'text-sm leading-4 font-bold' : 'sr-only'}>
        Código promocional
      </label>
      <div
        className={cn(
          'flex overflow-hidden',
          variant === 'desktop'
            ? 'h-10 rounded-[3px] border border-brand'
            : 'h-[50px] rounded-[40px] border border-border bg-surface-card shadow-overlay',
          error && 'border-coral',
        )}
      >
        <input
          id={inputId}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-foreground placeholder:text-tan focus:outline-none',
            variant === 'desktop' ? 'px-2 text-xs' : 'px-4 text-[13px]',
          )}
        />
        <button
          type="submit"
          disabled={apply.isPending}
          aria-busy={apply.isPending}
          className={cn(
            'shrink-0 text-[15px] font-bold disabled:opacity-60',
            variant === 'desktop'
              ? 'w-[102px] bg-brand text-ink hover:brightness-110'
              : 'w-[97px] rounded-[40px] bg-linear-to-r from-brand/55 to-brand text-foreground',
          )}
        >
          {apply.isPending ? '…' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-[13px] text-coral">
          {error}
        </p>
      )}
    </form>
  )
}
