import Decimal from 'decimal.js'
import type { Edition, EditionId, NftDetail, NftSummary } from '@/api/contracts/catalog'
import type { NftRecord } from '../fixtures/nfts'

export const EDITION_LABELS: Record<EditionId, string> = {
  '1-1': '1/1',
  '1-10': '1/10',
  '1-50': '1/50',
  open: 'ABERTA',
}

/** Ordem de preferência da edição padrão: a 1/50 é a exibida no layout. */
const DEFAULT_EDITION_ORDER: EditionId[] = ['1-50', '1-10', 'open', '1-1']

export function defaultEdition(record: NftRecord) {
  return (
    DEFAULT_EDITION_ORDER.map((id) => record.editions.find((edition) => edition.id === id)).find(
      (edition) => edition && edition.available > 0,
    ) ?? record.editions.find((edition) => edition.id === '1-50')!
  )
}

export function toEdition(edition: NftRecord['editions'][number]): Edition {
  return { ...edition, label: EDITION_LABELS[edition.id] }
}

export function toSummary(record: NftRecord): NftSummary {
  const edition = defaultEdition(record)
  return {
    id: record.id,
    name: record.name,
    tokenId: record.tokenId,
    artwork: record.artwork,
    category: record.category,
    network: record.network,
    priceEth: edition.priceEth,
    previousPriceEth: edition.previousPriceEth,
    badge: record.badge,
    available: record.editions.reduce((total, current) => total + current.available, 0),
    listedAt: record.listedAt,
    version: record.version,
  }
}

export function averageRating(record: NftRecord) {
  if (record.reviews.length === 0) return 0
  const total = record.reviews.reduce((sum, review) => sum + review.rating, 0)
  return new Decimal(total).div(record.reviews.length).toDecimalPlaces(1).toNumber()
}

const NETWORK_TEXT = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const

export function toDetail(record: NftRecord, related: NftRecord[]): NftDetail {
  const network = NETWORK_TEXT[record.network]
  const short = `${record.contractAddress.slice(0, 6)}...${record.contractAddress.slice(-4)}`
  return {
    ...toSummary(record),
    description: `Um colecionável digital finalizado à mão da coleção ${record.collection.name}, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.`,
    longDescription: [
      `${record.name} é uma obra digital finalizada à mão da coleção ${record.collection.name}. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${record.creator} recebe ${record.royaltyPercent}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    specs: [
      { label: 'Rede', value: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.` },
      {
        label: 'Contrato',
        value: `Direitos autorais do criador: ${record.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
      },
      { label: 'Direitos autorais', value: `${short} • Contrato inteligente ERC-721 verificado.` },
    ],
    collection: record.collection,
    creator: record.creator,
    attributes: record.attributes,
    contractAddress: record.contractAddress,
    royaltyPercent: record.royaltyPercent,
    rating: { average: averageRating(record), count: record.reviews.length },
    reviews: record.reviews,
    editions: record.editions.map(toEdition),
    gallery: [record.artwork, record.artwork, record.artwork, record.artwork],
    related: related.map(toSummary),
  }
}
