import Decimal from 'decimal.js'
import type { Artwork, Category, EditionId, Review } from '@/api/contracts/catalog'
import type { Network } from '@/api/contracts/common'
import { createRandom } from '../lib/random'

/** Registro do NFT no banco simulado (superset do contrato de detalhe). */
export interface NftRecord {
  id: string
  name: string
  tokenId: string
  artwork: Artwork
  category: Category
  network: Network
  collection: { id: string; name: string }
  creator: string
  attributes: string[]
  badge: 'raro' | null
  listedAt: string
  trendingScore: number
  contractAddress: string
  royaltyPercent: number
  reviews: Review[]
  editions: Array<{
    id: EditionId
    priceEth: string
    previousPriceEth: string | null
    available: number
    maxPerOrder: number
  }>
  version: number
}

/** Data de referência das fixtures: datas são fixas para testes determinísticos. */
export const FIXTURE_NOW = Date.parse('2026-11-01T12:00:00.000Z')
const DAY = 86_400_000

const FAMILIES: Record<Artwork, { collection: string; attributes: string[]; names: string[] }> = {
  'ape-emerald': {
    collection: 'Kurio Apes',
    attributes: ['Óculos', 'Esmeralda', 'Jaqueta college'],
    names: ['Emerald Ape', 'Jade Rebel', 'Verdant Ace', 'Forest Shade', 'Mint Captain', 'Clover King', 'Moss Runner'],
  },
  'gorilla-nomad': {
    collection: 'Nomad Club',
    attributes: ['Chapéu bucket', 'Moletom', 'Barba prateada'],
    names: [
      'Sage Nomad',
      'Cosmic Bloom',
      'Violet Nomad',
      'Lilac Drifter',
      'Lavender Sage',
      'Plum Wanderer',
      'Iris Monk',
    ],
  },
  'ape-baron': {
    collection: 'Baron Society',
    attributes: ['Blazer', 'Gola alta', 'Brinco'],
    names: [
      'Neon Vessel',
      'Ivory Baron',
      'Onyx Chancellor',
      'Pearl Envoy',
      'Slate Regent',
      'Coal Diplomat',
      'Linen Count',
    ],
  },
  'ape-golden': {
    collection: 'Golden Frequencies',
    attributes: ['Fones', 'Pelagem dourada', 'Jaqueta bomber'],
    names: [
      'Golden Beat',
      'Golden Signal',
      'Golden Frequency',
      'Amber Groove',
      'Honey Rhythm',
      'Saffron Echo',
      'Topaz Tempo',
    ],
  },
}

const CREATORS = ['Nova Sato', 'Lia Moreau', 'Kenji Arai', 'Duda Ventura', 'Theo Okafor', 'Maya Lund']
const REVIEWERS = [
  'Rafa M.',
  'Bea L.',
  'Caio T.',
  'Nina P.',
  'Gus R.',
  'Lara S.',
  'Davi K.',
  'Iris V.',
  'Leo F.',
  'Mia C.',
]
const REVIEW_TEXTS = [
  'Arte impecável, os detalhes em alta resolução são incríveis.',
  'Entrega rápida na carteira e procedência clara.',
  'Uma das melhores peças da coleção.',
  'O acesso para colecionadores vale muito a pena.',
  'Cores lindas, ficou perfeito na minha galeria.',
  'Criador muito ativo com a comunidade.',
]

/** Itens que aparecem no Figma, com os mesmos nomes, preços e posições. */
const FIGMA_ITEMS: Array<{
  name: string
  number: string
  artwork: Artwork
  price: string
  previous?: string
  badge?: 'raro'
  reviews?: number
}> = [
  { name: 'Emerald Ape', number: '042', artwork: 'ape-emerald', price: '1.19', reviews: 19 },
  { name: 'Sage Nomad', number: '009', artwork: 'gorilla-nomad', price: '1.69' },
  { name: 'Neon Vessel', number: '552', artwork: 'ape-baron', price: '1.99', previous: '2.29', badge: 'raro' },
  { name: 'Cosmic Bloom', number: '118', artwork: 'gorilla-nomad', price: '1.29' },
  { name: 'Violet Nomad', number: '314', artwork: 'gorilla-nomad', price: '1.39' },
  { name: 'Ivory Baron', number: '088', artwork: 'ape-baron', price: '1.79' },
  { name: 'Golden Beat', number: '207', artwork: 'ape-golden', price: '0.99' },
  { name: 'Golden Frequency', number: '071', artwork: 'ape-golden', price: '0.59' },
  { name: 'Golden Signal', number: '160', artwork: 'ape-golden', price: '0.39' },
]

/** Pesos por coleção: distribuição desigual, como as contagens do layout. */
const CATEGORY_WEIGHTS: Category[] = [
  ...Array<Category>(6).fill('musica'),
  ...Array<Category>(5).fill('arte-digital'),
  ...Array<Category>(4).fill('arte-3d'),
  ...Array<Category>(3).fill('colecionaveis'),
  ...Array<Category>(2).fill('generativa'),
  ...Array<Category>(2).fill('jogos'),
  ...Array<Category>(2).fill('utilidade'),
  'fotografia',
  'assinaturas',
]
const NETWORK_CYCLE: Network[] = ['ethereum', 'polygon', 'solana', 'ethereum']

function slug(name: string, number: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${number}`
}

function money(value: Decimal.Value) {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2)
}

/**
 * Edições derivadas do preço da 1/50 (a edição exibida no layout).
 * 1/1 custa 10×, 1/10 custa 2,5× e a aberta custa metade.
 */
function buildEditions(base: string, previous: string | null, random: ReturnType<typeof createRandom>, index: number) {
  const soldOutEdition = index % 7 === 3 ? '1-10' : index % 11 === 5 ? '1-1' : null
  const editions: NftRecord['editions'] = [
    { id: '1-1', priceEth: money(new Decimal(base).mul(10)), previousPriceEth: null, available: 1, maxPerOrder: 1 },
    {
      id: '1-10',
      priceEth: money(new Decimal(base).mul(2.5)),
      previousPriceEth: null,
      available: random.int(2, 10),
      maxPerOrder: 5,
    },
    { id: '1-50', priceEth: base, previousPriceEth: previous, available: random.int(8, 50), maxPerOrder: 10 },
    { id: 'open', priceEth: money(new Decimal(base).div(2)), previousPriceEth: null, available: 999, maxPerOrder: 20 },
  ]
  return editions.map((edition) => (edition.id === soldOutEdition ? { ...edition, available: 0 } : edition))
}

function buildReviews(id: string, count: number, random: ReturnType<typeof createRandom>, listedAt: number): Review[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${id}-review-${index + 1}`,
    author: REVIEWERS[(index + id.length) % REVIEWERS.length],
    rating: random.next() < 0.78 ? 5 : 4,
    comment: REVIEW_TEXTS[(index * 3 + id.length) % REVIEW_TEXTS.length],
    createdAt: new Date(listedAt + (index + 1) * DAY * 0.7).toISOString(),
  }))
}

/** Gera o catálogo: 9 itens do Figma + itens derivados, total de 63 (7 páginas). */
export function buildNftFixtures(seed = 4242): NftRecord[] {
  const random = createRandom(seed)
  const items: Array<{
    name: string
    number: string
    artwork: Artwork
    price: string
    previous?: string
    badge?: 'raro'
    reviews?: number
  }> = [...FIGMA_ITEMS]
  const artworks: Artwork[] = ['ape-emerald', 'gorilla-nomad', 'ape-baron', 'ape-golden']
  const used = new Set(items.map((item) => `${item.name}`))

  let cursor = 0
  while (items.length < 63) {
    const artwork = artworks[cursor % artworks.length]
    const names = FAMILIES[artwork].names
    const name = names[Math.floor(cursor / artworks.length) % names.length]
    const number = String(random.int(1, 999)).padStart(3, '0')
    cursor += 1
    if (used.has(`${name} #${number}`)) continue
    used.add(`${name} #${number}`)
    const price = money(random.int(2, 1230) / 100) // 0.02 a 12.30 ETH, como a faixa do layout
    const hasDiscount = random.next() < 0.18
    items.push({
      name,
      number,
      artwork,
      price,
      previous: hasDiscount ? money(new Decimal(price).mul(1.15)) : undefined,
      badge: random.next() < 0.12 ? 'raro' : undefined,
    })
  }

  return items.map((item, index) => {
    const id = slug(item.name, item.number)
    const family = FAMILIES[item.artwork]
    const listedAt = FIXTURE_NOW - index * DAY * 1.5 - random.int(0, 20) * 3_600_000
    const reviewCount = item.reviews ?? random.int(2, 24)
    return {
      id,
      name: `${item.name} #${item.number}`,
      tokenId: `#${item.number.padStart(4, '0')}`,
      artwork: item.artwork,
      category: index === 0 ? 'arte-digital' : random.pick(CATEGORY_WEIGHTS),
      network: NETWORK_CYCLE[(index + Math.floor(index / 4)) % NETWORK_CYCLE.length],
      collection: { id: slug(family.collection, 'col'), name: family.collection },
      creator: CREATORS[index % CREATORS.length],
      attributes: item.badge ? [...family.attributes.slice(0, 2), 'Raro'] : family.attributes,
      badge: item.badge ?? null,
      listedAt: new Date(listedAt).toISOString(),
      trendingScore: random.int(0, 100),
      contractAddress: `0x${(0x7a42 + index).toString(16).toUpperCase()}${'0'.repeat(30)}${(0x19e8 + index).toString(16).toUpperCase()}`,
      royaltyPercent: 5,
      reviews: buildReviews(id, reviewCount, random, listedAt),
      editions: buildEditions(item.price, item.previous ?? null, random, index),
      version: 1,
    }
  })
}
