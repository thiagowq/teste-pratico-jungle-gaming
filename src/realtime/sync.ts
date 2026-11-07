import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Cart } from '@/api/contracts/cart'
import type { NftDetail } from '@/api/contracts/catalog'
import { queryKeys } from '@/lib/query-keys'
import type { NftUpdatedEvent } from './events'
import { realtime } from './socket'

const EDITION_LABEL: Record<string, string> = { '1-1': '1/1', '1-10': '1/10', '1-50': '1/50', open: 'aberta' }

/** Carrinhos em cache (do usuário ou do visitante) que contêm o NFT. */
function cartsWith(queryClient: QueryClient, nftId: string) {
  return queryClient
    .getQueriesData<Cart>({ predicate: (query) => query.queryKey.includes('cart') })
    .flatMap(([, cart]) => (cart ? cart.items.filter((item) => item.nftId === nftId) : []))
}

/** Frases do aviso: só o que mudou e importa para quem está olhando (carrinho ou detalhe aberto). */
function describeChanges(event: NftUpdatedEvent, queryClient: QueryClient) {
  const detail = queryClient.getQueryData<NftDetail>(queryKeys.nfts.detail(event.resource.id))
  const inCart = cartsWith(queryClient, event.resource.id)
  const name = detail?.name ?? inCart[0]?.name
  if (!name) return []

  const messages: string[] = []
  for (const edition of event.data.editions) {
    const before =
      detail?.editions.find((candidate) => candidate.id === edition.id) ??
      inCart
        .filter((item) => item.editionId === edition.id)
        .map((item) => ({ priceEth: item.unitPriceEth, available: item.available }))[0]
    if (!before) continue
    const label = `${name} (edição ${EDITION_LABEL[edition.id] ?? edition.id})`
    const relevant = Boolean(detail) || inCart.some((item) => item.editionId === edition.id)
    if (!relevant) continue
    if (before.priceEth !== edition.priceEth) {
      messages.push(`O preço de ${label} mudou de ${before.priceEth} para ${edition.priceEth} ETH.`)
    }
    if (before.available > 0 && edition.available === 0) messages.push(`${label} esgotou.`)
    else if (before.available !== edition.available && edition.available > 0 && inCart.length > 0) {
      messages.push(`Disponibilidade de ${label}: ${edition.available}.`)
    }
  }
  return messages
}

function applyNftUpdate(queryClient: QueryClient, event: NftUpdatedEvent) {
  const messages = describeChanges(event, queryClient)

  // Detalhe: aplica o evento direto no cache (preço e estoque por edição).
  queryClient.setQueryData<NftDetail>(queryKeys.nfts.detail(event.resource.id), (current) => {
    if (!current || current.version >= event.version) return current
    const editions = current.editions.map((edition) => {
      const next = event.data.editions.find((candidate) => candidate.id === edition.id)
      if (!next) return edition
      return {
        ...edition,
        previousPriceEth: next.priceEth !== edition.priceEth ? edition.priceEth : edition.previousPriceEth,
        priceEth: next.priceEth,
        available: next.available,
      }
    })
    return { ...current, version: event.version, editions }
  })

  // Listagens e carrinho dependem de valores calculados pelo servidor: revalida via REST.
  void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all, refetchType: 'active' })
  void queryClient.invalidateQueries({
    predicate: (query) => query.queryKey.includes('cart'),
    refetchType: 'active',
  })

  for (const message of messages) toast.info(message, { id: `${event.id}-${message}` })
}

/**
 * Liga os eventos Socket.IO ao cache do TanStack Query. Retorna a limpeza
 * (remove os listeners). Duplicatas e eventos antigos já são filtrados pelo
 * `EventGate` do cliente de tempo real.
 */
export function startRealtimeSync(queryClient: QueryClient) {
  const offNft = realtime.on('nft.updated', (event) => applyNftUpdate(queryClient, event))
  // Reconexão: o que aconteceu enquanto o socket estava fora é recuperado pela API.
  const offReconnect = realtime.onReconnect(() => {
    void queryClient.invalidateQueries({ refetchType: 'active' })
  })
  return () => {
    offNft()
    offReconnect()
  }
}
