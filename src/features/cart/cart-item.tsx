import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { CartItem as CartItemData, CartItemIssue } from '@/api/contracts/cart'
import type { ApiError } from '@/api/errors'
import { DeleteIcon } from '@/components/icons'
import { NftImage } from '@/components/nft-image'
import { QuantityStepper } from '@/components/quantity-stepper'
import { formatEth } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAddToCart, useRemoveCartItem, useUpdateCartItem } from './use-cart'

function issueMessage(issue: CartItemIssue) {
  switch (issue.type) {
    case 'price-changed':
      return `Preço alterado: era ${formatEth(issue.previousPriceEth)}.`
    case 'insufficient-stock':
      return `Só ${issue.available} ${issue.available === 1 ? 'disponível' : 'disponíveis'} agora.`
    case 'sold-out':
      return 'Esta edição esgotou. Remova o item para continuar.'
  }
}

/**
 * Ações de um item: alterar quantidade (botões travados enquanto a alteração
 * anterior não volta, evitando respostas fora de ordem) e remover com "desfazer".
 */
function useCartItemActions(item: CartItemData) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const add = useAddToCart()
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null)

  const onError = (error: unknown) => {
    const apiError = error as ApiError
    if (!apiError.isAuthError) toast.error(apiError.message)
  }

  const changeQuantity = (quantity: number) => {
    setPendingQuantity(quantity)
    update.mutate(
      { nftId: item.nftId, editionId: item.editionId, quantity },
      { onError, onSettled: () => setPendingQuantity(null) },
    )
  }

  const removeItem = () => {
    const removed = { nftId: item.nftId, editionId: item.editionId, quantity: item.quantity }
    remove.mutate(
      { nftId: item.nftId, editionId: item.editionId },
      {
        onError,
        onSuccess: () =>
          toast.success(`${item.name} removido do carrinho.`, {
            action: { label: 'Desfazer', onClick: () => add.mutate(removed, { onError }) },
          }),
      },
    )
  }

  const soldOut = item.issues.some((issue) => issue.type === 'sold-out')
  return {
    quantity: pendingQuantity ?? item.quantity,
    max: Math.max(1, Math.min(item.maxPerOrder, item.available)),
    busy: update.isPending || remove.isPending,
    soldOut,
    changeQuantity,
    removeItem,
  }
}

function Issues({ item, className }: { item: CartItemData; className?: string }) {
  if (item.issues.length === 0) return null
  return (
    <ul className={cn('flex flex-col gap-1 text-[13px] leading-4 text-amber', className)}>
      {item.issues.map((issue) => (
        <li key={issue.type} className="flex items-start gap-1">
          <span aria-hidden>⚠</span>
          {issueMessage(issue)}
        </li>
      ))}
    </ul>
  )
}

/** Linha da tabela do carrinho no desktop (782px no Figma). */
export function CartItemRow({ item }: { item: CartItemData }) {
  const actions = useCartItemActions(item)
  return (
    <li
      className={cn('bg-surface-card pr-6', item.issues.length > 0 && 'ring-1 ring-amber/50')}
      aria-busy={actions.busy}
    >
      <div className="grid min-h-[70px] grid-cols-[minmax(0,250px)_77px_75px_87px_24px] items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/nft/$nftId"
            params={{ nftId: item.nftId }}
            search={{ edicao: item.editionId }}
            className="shrink-0"
          >
            <NftImage artwork={item.artwork} alt="" sizes="70px" className="size-[70px] rounded-md" />
          </Link>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Link
              to="/nft/$nftId"
              params={{ nftId: item.nftId }}
              search={{ edicao: item.editionId }}
              className="truncate text-base leading-4 font-bold hover:text-brand-accent"
            >
              {item.name}
            </Link>
            <span className="text-sm leading-4 text-tan">
              ID do token: {item.tokenId} · Edição {item.editionLabel}
            </span>
          </div>
        </div>
        <span className="text-center text-base leading-4 font-bold text-text-secondary">
          <span className="sr-only">Preço unitário: </span>
          {formatEth(item.unitPriceEth)}
        </span>
        <QuantityStepper
          size="sm"
          value={actions.quantity}
          max={actions.max}
          onChange={actions.changeQuantity}
          itemName={item.name}
          disabled={actions.busy || actions.soldOut}
        />
        <span className="text-base leading-4 font-bold text-brand-accent">
          <span className="sr-only">Total do item: </span>
          {formatEth(item.lineTotalEth)}
        </span>
        <button
          type="button"
          onClick={actions.removeItem}
          disabled={actions.busy}
          aria-label={`Remover ${item.name} do carrinho`}
          className="grid size-6 place-items-center rounded-sm hover:bg-surface-raised disabled:opacity-40"
        >
          <DeleteIcon aria-hidden />
        </button>
      </div>
      <Issues item={item} className="px-[86px] pb-3" />
    </li>
  )
}

/** Card do item no mobile (358×100 no Figma). */
export function CartItemCard({ item }: { item: CartItemData }) {
  const actions = useCartItemActions(item)
  return (
    <li
      className={cn(
        'relative flex min-h-[100px] overflow-hidden rounded-[14px] bg-surface-card shadow-overlay',
        item.issues.length > 0 && 'ring-1 ring-amber/50',
      )}
      aria-busy={actions.busy}
    >
      <Link to="/nft/$nftId" params={{ nftId: item.nftId }} search={{ edicao: item.editionId }} className="shrink-0">
        <NftImage artwork={item.artwork} alt="" sizes="100px" className="size-[100px] rounded-[14px]" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-3 pr-4 pl-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="truncate text-[15px] leading-4 font-bold">{item.name}</h2>
          <button
            type="button"
            onClick={actions.removeItem}
            disabled={actions.busy}
            aria-label={`Remover ${item.name} do carrinho`}
            className="-mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-sm disabled:opacity-40"
          >
            <DeleteIcon aria-hidden className="size-5" color="var(--kurio-primary)" />
          </button>
        </div>
        <p className="text-sm leading-4 text-text-secondary">Edição: {item.editionLabel}</p>
        <div className="mt-auto flex items-end justify-between gap-2">
          <span className="text-lg leading-4 font-bold text-brand-accent">
            <span className="sr-only">Total do item: </span>
            {formatEth(item.lineTotalEth)}
          </span>
          <QuantityStepper
            size="round"
            value={actions.quantity}
            max={actions.max}
            onChange={actions.changeQuantity}
            itemName={item.name}
            disabled={actions.busy || actions.soldOut}
          />
        </div>
        <Issues item={item} />
      </div>
    </li>
  )
}
