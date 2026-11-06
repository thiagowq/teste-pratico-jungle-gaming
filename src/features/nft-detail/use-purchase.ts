import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { EditionId, NftDetail } from '@/api/contracts/catalog'
import type { ApiError } from '@/api/errors'
import { useAddToCart, useCart } from '@/features/cart/use-cart'
import { queryKeys } from '@/lib/query-keys'

const DEFAULT_ORDER: EditionId[] = ['1-50', '1-10', 'open', '1-1']

/** Edição inicial: a 1/50 (exibida no layout) ou a primeira com estoque. */
export function defaultEditionId(nft: NftDetail): EditionId {
  return DEFAULT_ORDER.find((id) => nft.editions.some((edition) => edition.id === id && edition.available > 0)) ?? '1-50'
}

/**
 * Regras de compra no detalhe: a quantidade máxima considera estoque, limite
 * por pedido e o que já está no carrinho para a mesma edição.
 */
export function usePurchase(nft: NftDetail, editionId: EditionId) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const cart = useCart()
  const add = useAddToCart()
  const edition = nft.editions.find((candidate) => candidate.id === editionId) ?? nft.editions[0]
  const inCart = cart.data?.items.find((item) => item.nftId === nft.id && item.editionId === edition.id)?.quantity ?? 0
  const limit = Math.max(0, Math.min(edition.available, edition.maxPerOrder) - inCart)

  // A quantidade escolhida volta para 1 ao trocar de edição.
  const [quantityState, setQuantityState] = useState({ editionId: edition.id, value: 1 })
  const quantity = quantityState.editionId === edition.id ? Math.min(quantityState.value, Math.max(limit, 1)) : 1
  const setQuantity = (value: number) => setQuantityState({ editionId: edition.id, value })

  const blockedReason =
    edition.available === 0
      ? 'Esta edição está esgotada. Escolha outra edição.'
      : limit === 0
        ? `Você já tem o limite desta edição no carrinho (${inCart}).`
        : null

  const hint =
    blockedReason ??
    `${edition.available} disponíveis · máximo de ${edition.maxPerOrder} por pedido${inCart ? ` · ${inCart} no carrinho` : ''}`

  const submit = (goToCart: boolean) => {
    if (blockedReason || add.isPending) return
    add.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      {
        onSuccess: () => {
          setQuantity(1)
          if (goToCart) {
            void navigate({ to: '/carrinho' })
          } else {
            toast.success(`${nft.name} (${edition.label}) adicionado ao carrinho.`, {
              action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/carrinho' }) },
            })
          }
        },
        onError: (error) => {
          const apiError = error as ApiError
          if (apiError.code === 'OUT_OF_STOCK') {
            // Disponibilidade mudou: atualiza o detalhe para refletir o estoque real.
            void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.detail(nft.id) })
          }
          if (!apiError.isAuthError) toast.error(apiError.message)
        },
      },
    )
  }

  return { edition, quantity, setQuantity, limit, inCart, blockedReason, hint, submit, isAdding: add.isPending }
}
