import { z } from 'zod'
import { ethAmount, isoDate, network, pagination } from './common'

export const CATEGORIES = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
] as const
export const category = z.enum(CATEGORIES)
export type Category = z.infer<typeof category>

export const CATEGORY_LABELS: Record<Category, string> = {
  'arte-digital': 'Arte digital',
  fotografia: 'Fotografia',
  musica: 'Música',
  'arte-3d': 'Arte 3D',
  colecionaveis: 'Colecionáveis',
  generativa: 'Generativa',
  jogos: 'Jogos',
  assinaturas: 'Assinaturas',
  utilidade: 'Utilidade',
}

/** Edições do layout: 1/1, 1/10, 1/50 e aberta. Cada uma tem preço e estoque próprios. */
export const EDITION_IDS = ['1-1', '1-10', '1-50', 'open'] as const
export const editionId = z.enum(EDITION_IDS)
export type EditionId = z.infer<typeof editionId>

export const edition = z.object({
  id: editionId,
  label: z.string(),
  priceEth: ethAmount,
  /** Preço anterior, exibido riscado quando houve redução. */
  previousPriceEth: ethAmount.nullable(),
  available: z.number().int().min(0),
  /** Limite de unidades por pedido para esta edição. */
  maxPerOrder: z.number().int().min(1),
})
export type Edition = z.infer<typeof edition>

export const artwork = z.enum(['ape-emerald', 'gorilla-nomad', 'ape-baron', 'ape-golden'])
export type Artwork = z.infer<typeof artwork>

export const nftSummary = z.object({
  id: z.string(),
  name: z.string(),
  tokenId: z.string(),
  artwork,
  category,
  network,
  /** Preço da edição padrão (a primeira com estoque). */
  priceEth: ethAmount,
  previousPriceEth: ethAmount.nullable(),
  badge: z.enum(['raro']).nullable(),
  /** Total disponível somando todas as edições. */
  available: z.number().int().min(0),
  listedAt: isoDate,
  /** Versão do recurso; eventos `nft.updated` com versão menor ou igual são descartados. */
  version: z.number().int().min(1),
})
export type NftSummary = z.infer<typeof nftSummary>

export const review = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: isoDate,
})
export type Review = z.infer<typeof review>

export const nftDetail = nftSummary.extend({
  description: z.string(),
  longDescription: z.array(z.string()),
  /** Ficha técnica exibida como "Rótulo: valor" na aba de detalhes. */
  specs: z.array(z.object({ label: z.string(), value: z.string() })),
  collection: z.object({ id: z.string(), name: z.string() }),
  creator: z.string(),
  attributes: z.array(z.string()),
  contractAddress: z.string(),
  royaltyPercent: z.number(),
  rating: z.object({ average: z.number(), count: z.number().int() }),
  reviews: z.array(review),
  editions: z.array(edition).min(1),
  gallery: z.array(artwork).min(1),
  related: z.array(nftSummary),
})
export type NftDetail = z.infer<typeof nftDetail>

/* ---------- Listagem ---------- */

export const NFT_TABS = ['all', 'new', 'trending'] as const
export const NFT_SORTS = ['recent', 'price-asc', 'price-desc', 'rating'] as const

export const NFT_SORT_LABELS: Record<(typeof NFT_SORTS)[number], string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  rating: 'Mais bem avaliados',
}

export const NFT_PAGE_SIZE = 9

/** Parâmetros da listagem. Também é o schema da query string da página inicial. */
export const nftListParams = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  categories: z.array(category).optional().catch(undefined),
  networks: z.array(network).optional().catch(undefined),
  minPrice: ethAmount.optional().catch(undefined),
  maxPrice: ethAmount.optional().catch(undefined),
  tab: z.enum(NFT_TABS).optional().catch(undefined),
  sort: z.enum(NFT_SORTS).optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
})
export type NftListParams = z.infer<typeof nftListParams>

export const facetCount = z.object({ id: z.string(), count: z.number().int().min(0) })

export const nftListResponse = pagination.extend({
  items: z.array(nftSummary),
  facets: z.object({
    categories: z.array(facetCount.extend({ id: category })),
    networks: z.array(facetCount.extend({ id: network })),
    priceRange: z.object({ min: ethAmount, max: ethAmount }),
  }),
})
export type NftListResponse = z.infer<typeof nftListResponse>

export const featuredResponse = z.object({ items: z.array(nftSummary) })
