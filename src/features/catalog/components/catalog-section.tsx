import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NFT_PAGE_SIZE, type NftListParams } from '@/api/contracts/catalog'
import type { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { nftListQuery } from '../queries'
import { CatalogFilters } from './catalog-filters'
import { CatalogSort, CatalogTabs } from './catalog-toolbar'
import { FeaturedBanner } from './featured-banner'
import { NftCard, NftCardSkeleton } from './nft-card'
import { Pagination } from './pagination'

interface CatalogSectionProps {
  params: NftListParams
  onChange: (patch: Partial<NftListParams>, options?: { keepPage?: boolean }) => void
}

/** Grid do catálogo: 3 colunas no desktop; no mobile, 2 colunas com a direita deslocada 32px (como no frame). */
const GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-[34px] md:gap-y-[72px] max-md:[&>li:nth-child(even)]:translate-y-8 max-md:pb-8'

function StatusMessage({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface-card p-8 text-center">
      <p className="text-lg font-bold">{title}</p>
      <p className="max-w-sm text-sm leading-6 text-text-secondary">{description}</p>
      {action}
    </div>
  )
}

export function CatalogSection({ params, onChange }: CatalogSectionProps) {
  const query = useQuery(nftListQuery(params))
  const headingRef = useRef<HTMLHeadingElement>(null)
  const data = query.data
  const page = params.page ?? 1
  const isInitialLoading = query.isPending
  const isRefreshing = query.isFetching && !query.isPending
  const hasFilters = Boolean(
    params.q || params.categories?.length || params.networks?.length || params.minPrice || params.maxPrice || params.tab,
  )

  const changePage = (next: number) => {
    onChange({ page: next === 1 ? undefined : next }, { keepPage: true })
    headingRef.current?.scrollIntoView({ block: 'start' })
    headingRef.current?.focus({ preventScroll: true })
  }

  const clearAll = () =>
    onChange({ q: undefined, categories: undefined, networks: undefined, minPrice: undefined, maxPrice: undefined, tab: undefined })

  let results: React.ReactNode
  if (isInitialLoading) {
    results = (
      <ul className={GRID_CLASS} aria-hidden>
        {Array.from({ length: NFT_PAGE_SIZE }, (_, index) => (
          <li key={index}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    )
  } else if (query.isError && !data) {
    results = (
      <StatusMessage
        title="Não foi possível carregar o catálogo"
        description={(query.error as ApiError).message}
        action={
          <Button onClick={() => void query.refetch()} aria-busy={query.isFetching}>
            {query.isFetching ? 'Tentando novamente…' : 'Tentar novamente'}
          </Button>
        }
      />
    )
  } else if (data && data.items.length === 0) {
    results =
      data.total > 0 ? (
        <StatusMessage
          title="Página fora do intervalo"
          description={`O catálogo tem ${data.totalPages} páginas para esta busca.`}
          action={<Button onClick={() => changePage(data.totalPages)}>Ir para a última página</Button>}
        />
      ) : (
        <StatusMessage
          title="Nenhum NFT encontrado"
          description={
            hasFilters ? 'Tente remover alguns filtros ou buscar por outro termo.' : 'Ainda não há NFTs listados no mercado.'
          }
          action={hasFilters ? <Button onClick={clearAll}>Limpar busca e filtros</Button> : undefined}
        />
      )
  } else if (data) {
    results = (
      <div className={isRefreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        <ul className={GRID_CLASS}>
          {data.items.map((nft, index) => (
            <li key={nft.id}>
              <NftCard nft={nft} priority={index < 3} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <section id="mercado" aria-labelledby="catalog-heading" className="scroll-mt-6">
      <div className="flex gap-12">
        <aside className="hidden w-[310px] shrink-0 flex-col gap-6 lg:flex" aria-label="Filtros">
          <div className="bg-surface-card p-5">
            <CatalogFilters params={params} facets={data?.facets} onChange={onChange} />
          </div>
          <FeaturedBanner />
        </aside>

        <div className="min-w-0 flex-1">
          <h2 id="catalog-heading" ref={headingRef} tabIndex={-1} className="sr-only scroll-mt-6">
            Catálogo de NFTs
          </h2>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 md:mb-8">
            <CatalogTabs params={params} onChange={onChange} />
            <CatalogSort params={params} onChange={onChange} className="max-md:hidden" />
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {isInitialLoading
              ? 'Carregando NFTs…'
              : isRefreshing
                ? 'Atualizando resultados…'
                : data
                  ? `${data.total} NFTs encontrados. Página ${data.page} de ${Math.max(data.totalPages, 1)}.`
                  : ''}
          </p>

          {query.isError && data && (
            <p role="alert" className="mb-4 rounded-md border border-coral/50 bg-surface-card px-4 py-3 text-sm text-coral">
              Não foi possível atualizar os resultados. Mostrando os dados mais recentes.{' '}
              <button type="button" className="font-bold underline" onClick={() => void query.refetch()}>
                Tentar novamente
              </button>
            </p>
          )}

          {results}

          {data && <Pagination page={page} totalPages={data.totalPages} onPageChange={changePage} className="mt-12 md:mt-[88px]" />}
        </div>
      </div>
    </section>
  )
}
