import Decimal from 'decimal.js'
import { HttpResponse, http } from 'msw'
import {
  NFT_PAGE_SIZE,
  nftListParams,
  type Category,
  type NftListParams,
  type NftListResponse,
} from '@/api/contracts/catalog'
import { NETWORKS, type Network } from '@/api/contracts/common'
import { CATEGORIES } from '@/api/contracts/catalog'
import { db } from '../db'
import { FIXTURE_NOW, type NftRecord } from '../fixtures/nfts'
import { apiError, withNetwork } from '../lib/respond'
import { hasFlag } from '../lib/scenario'
import { averageRating, defaultEdition, toDetail, toSummary } from '../lib/serialize'

const API = '/api'
const NEW_RELEASE_WINDOW_MS = 21 * 86_400_000
const TRENDING_SCORE = 65

/** Lê a query string no mesmo formato que o Axios envia (arrays repetidos). */
function parseParams(url: URL): NftListParams {
  const search = url.searchParams
  const number = (key: string) => (search.has(key) ? Number(search.get(key)) : undefined)
  return nftListParams.parse({
    q: search.get('q') ?? undefined,
    categories: search.has('categories') ? search.getAll('categories') : undefined,
    networks: search.has('networks') ? search.getAll('networks') : undefined,
    minPrice: search.get('minPrice') ?? undefined,
    maxPrice: search.get('maxPrice') ?? undefined,
    tab: search.get('tab') ?? undefined,
    sort: search.get('sort') ?? undefined,
    page: number('page'),
  })
}

function price(record: NftRecord) {
  return new Decimal(defaultEdition(record).priceEth)
}

type Filter = (record: NftRecord) => boolean

function buildFilters(params: NftListParams) {
  const q = params.q?.toLowerCase()
  const search: Filter = (record) =>
    !q ||
    record.name.toLowerCase().includes(q) ||
    record.collection.name.toLowerCase().includes(q) ||
    record.creator.toLowerCase().includes(q)
  const categories: Filter = (record) => !params.categories?.length || params.categories.includes(record.category)
  const networks: Filter = (record) => !params.networks?.length || params.networks.includes(record.network)
  const priceRange: Filter = (record) =>
    (!params.minPrice || price(record).gte(params.minPrice)) && (!params.maxPrice || price(record).lte(params.maxPrice))
  const tab: Filter = (record) => {
    if (params.tab === 'new') return Date.parse(record.listedAt) >= FIXTURE_NOW - NEW_RELEASE_WINDOW_MS
    if (params.tab === 'trending') return record.trendingScore >= TRENDING_SCORE
    return true
  }
  return { search, categories, networks, priceRange, tab }
}

const sorters: Record<NonNullable<NftListParams['sort']>, (a: NftRecord, b: NftRecord) => number> = {
  recent: (a, b) => Date.parse(b.listedAt) - Date.parse(a.listedAt),
  'price-asc': (a, b) => price(a).comparedTo(price(b)),
  'price-desc': (a, b) => price(b).comparedTo(price(a)),
  rating: (a, b) => averageRating(b) - averageRating(a),
}

export function listNfts(params: NftListParams): NftListResponse {
  const state = db.get()
  const all = hasFlag('emptyCatalog') ? [] : state.nftOrder.map((id) => state.nfts[id])
  const filters = buildFilters(params)
  const apply = (records: NftRecord[], skip?: keyof typeof filters) =>
    records.filter((record) => Object.entries(filters).every(([key, filter]) => key === skip || filter(record)))

  // Contagens de cada faceta consideram os demais filtros, mas não o da própria faceta.
  const forCategories = apply(all, 'categories')
  const forNetworks = apply(all, 'networks')
  const countBy = <T extends string>(records: NftRecord[], ids: readonly T[], pick: (record: NftRecord) => T) =>
    ids.map((id) => ({ id, count: records.filter((record) => pick(record) === id).length }))

  const order = new Map(state.nftOrder.map((id, index) => [id, index]))
  const sorter = sorters[params.sort ?? 'recent']
  const matched = apply(all).sort((a, b) => sorter(a, b) || order.get(a.id)! - order.get(b.id)!)

  const page = params.page ?? 1
  const totalPages = Math.ceil(matched.length / NFT_PAGE_SIZE)
  const prices = all.map(price)
  const min = prices.length ? Decimal.min(...prices) : new Decimal(0)
  const max = prices.length ? Decimal.max(...prices) : new Decimal(0)

  return {
    items: matched.slice((page - 1) * NFT_PAGE_SIZE, page * NFT_PAGE_SIZE).map(toSummary),
    page,
    pageSize: NFT_PAGE_SIZE,
    total: matched.length,
    totalPages,
    facets: {
      categories: countBy<Category>(forCategories, CATEGORIES, (record) => record.category),
      networks: countBy<Network>(forNetworks, NETWORKS, (record) => record.network),
      priceRange: { min: min.toFixed(2), max: max.toFixed(2) },
    },
  }
}

export const catalogHandlers = [
  http.get(
    `${API}/nfts`,
    withNetwork('GET /nfts', ({ request }) => {
      const params = parseParams(new URL(request.url))
      return HttpResponse.json(listNfts(params))
    }),
  ),

  http.get(
    `${API}/nfts/featured`,
    withNetwork('GET /nfts/featured', () => {
      const state = db.get()
      const featured = hasFlag('emptyCatalog') ? [] : [state.nfts['cosmic-bloom-118']].filter(Boolean)
      return HttpResponse.json({ items: featured.map(toSummary) })
    }),
  ),

  http.get<{ id: string }>(
    `${API}/nfts/:id`,
    withNetwork('GET /nfts/:id', ({ params }) => {
      const state = db.get()
      const record = state.nfts[params.id]
      if (!record || hasFlag('emptyCatalog')) {
        return apiError(404, 'NOT_FOUND', 'Não encontramos este NFT. Ele pode ter sido removido do mercado.')
      }
      const related = state.nftOrder
        .map((id) => state.nfts[id])
        .filter((candidate) => candidate.id !== record.id && candidate.collection.id === record.collection.id)
        .slice(0, 5)
      return HttpResponse.json(toDetail(record, related))
    }),
  ),
]
