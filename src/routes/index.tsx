import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { nftListParams, type NftListParams } from '@/api/contracts/catalog'
import { Container } from '@/components/layout/container'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { nftListQuery } from '@/features/catalog/queries'
import { Blog } from '@/features/home/blog'
import { Hero } from '@/features/home/hero'
import { MobileCatalogBar } from '@/features/home/mobile-catalog-bar'
import { Promos } from '@/features/home/promos'

/**
 * Busca, filtros, aba, ordenação e página vivem na URL: sobrevivem a refresh,
 * podem ser compartilhados e respeitam voltar/avançar do navegador.
 * Parâmetros inválidos são descartados pelo schema em vez de quebrar a página.
 */
export const Route = createFileRoute('/')({
  validateSearch: nftListParams,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    // Pré-carrega sem bloquear a navegação: a página mostra skeletons enquanto isso.
    void context.queryClient.prefetchQuery(nftListQuery(deps))
  },
  head: () => ({ meta: [{ title: 'Kurio | Marketplace de NFTs' }] }),
  component: HomePage,
})

function HomePage() {
  const params = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const { data } = useQuery(nftListQuery(params))

  const onChange = useCallback(
    (patch: Partial<NftListParams>, options?: { keepPage?: boolean; replace?: boolean }) => {
      void navigate({
        search: (previous) => ({ ...previous, ...patch, page: options?.keepPage ? patch.page : undefined }),
        replace: options?.replace,
        resetScroll: false,
      })
    },
    [navigate],
  )

  return (
    <main className="flex flex-col gap-4 pt-10 md:gap-24 md:pt-8">
      <Container className="flex flex-col gap-4 md:gap-8">
        <MobileCatalogBar params={params} facets={data?.facets} total={data?.total} onChange={onChange} />
        <Hero />
      </Container>
      <Container>
        <CatalogSection params={params} onChange={onChange} />
      </Container>
      <Container className="max-md:mt-12">
        <Promos />
      </Container>
      <Container className="max-md:mt-12">
        <Blog />
      </Container>
    </main>
  )
}
