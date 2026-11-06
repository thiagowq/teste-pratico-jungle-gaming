import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { editionId as editionIdSchema, type EditionId, type NftDetail } from '@/api/contracts/catalog'
import type { ApiError } from '@/api/errors'
import { ArrowLeft2Icon, ShopIcon, StarIcon } from '@/components/icons'
import { Container } from '@/components/layout/container'
import { QuantityStepper } from '@/components/quantity-stepper'
import { RatingStars } from '@/components/rating-stars'
import { Button } from '@/components/ui/button'
import { NftCarousel } from '@/features/catalog/components/nft-carousel'
import { nftDetailQuery } from '@/features/catalog/queries'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { DetailTabs, type DetailTab } from '@/features/nft-detail/detail-tabs'
import { EditionPicker } from '@/features/nft-detail/edition-picker'
import { DesktopGallery, MobileGallery } from '@/features/nft-detail/gallery'
import { ShareLinks } from '@/features/nft-detail/share-links'
import { defaultEditionId, usePurchase } from '@/features/nft-detail/use-purchase'
import { formatEth } from '@/lib/format'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query'

const searchSchema = z.object({
  edicao: editionIdSchema.optional().catch(undefined),
  aba: z.enum(['detalhes', 'avaliacoes']).optional().catch(undefined),
})

export const Route = createFileRoute('/nft/$nftId')({
  validateSearch: searchSchema,
  loader: ({ context, params }) => {
    // Pré-carrega sem bloquear: acesso direto mostra o skeleton enquanto busca.
    void context.queryClient.prefetchQuery(nftDetailQuery(params.nftId))
  },
  head: () => ({ meta: [{ title: 'Detalhes do NFT | Kurio' }] }),
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const query = useQuery(nftDetailQuery(nftId))

  if (query.isPending) return <DetailSkeleton />
  if (query.isError) {
    const error = query.error as ApiError
    if (error.code === 'NOT_FOUND') return <NftNotFound />
    return (
      <main className="py-24">
        <Container className="flex flex-col items-start gap-4" role="alert">
          <h1 className="text-[28px] leading-[37px] font-bold">Não foi possível carregar este NFT</h1>
          <p className="text-text-secondary">{error.message}</p>
          <Button onClick={() => void query.refetch()} aria-busy={query.isFetching}>
            {query.isFetching ? 'Tentando novamente…' : 'Tentar novamente'}
          </Button>
        </Container>
      </main>
    )
  }
  return <NftDetailView nft={query.data} />
}

function NftDetailView({ nft }: { nft: NftDetail }) {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/nft/$nftId' })
  const [view, setView] = useState(0)
  const editionId: EditionId = search.edicao ?? defaultEditionId(nft)
  const tab: DetailTab = search.aba ?? 'detalhes'
  const purchase = usePurchase(nft, editionId)
  // Renderiza só a versão da largura atual (sem conteúdo e IDs duplicados).
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const { edition } = purchase

  const setEdition = (id: EditionId) =>
    void navigate({ search: (previous) => ({ ...previous, edicao: id }), replace: true, resetScroll: false })
  const setTab = (next: DetailTab) =>
    void navigate({
      search: (previous) => ({ ...previous, aba: next === 'detalhes' ? undefined : next }),
      replace: true,
      resetScroll: false,
    })
  const openReviews = () => {
    setTab('avaliacoes')
    document.getElementById('abas-detalhe')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const price = (
    <span className="flex items-center gap-3">
      <span className="font-bold text-brand-accent">
        <span className="sr-only">Preço da edição {edition.label}: </span>
        {formatEth(edition.priceEth)}
      </span>
      {edition.previousPriceEth && (
        <s className="text-base text-tan">
          <span className="sr-only">Preço anterior: </span>
          {formatEth(edition.previousPriceEth)}
        </s>
      )}
    </span>
  )

  const tokenInfo = (
    <dl className="flex flex-col gap-3 text-[15px] leading-5 text-tan">
      <div className="flex gap-1">
        <dt>ID do token:</dt>
        <dd>{nft.tokenId}</dd>
      </div>
      <div className="flex gap-1">
        <dt>Coleção:</dt>
        <dd>{nft.collection.name}</dd>
      </div>
      <div className="flex gap-1">
        <dt>Atributos:</dt>
        <dd>{nft.attributes.join(', ')}</dd>
      </div>
    </dl>
  )

  return (
    <main className="max-md:pb-[180px]">
      {/* ---------- Desktop / tablet ---------- */}
      {isDesktop ? (
        <Container className="pt-8">
          <nav aria-label="Trilha de navegação" className="text-[15px] leading-4 font-bold">
            <Link to="/" className="hover:text-brand-accent">
              Início
            </Link>
            <span aria-hidden> / </span>
            <Link to="/" hash="mercado" className="hover:text-brand-accent">
              Mercado
            </Link>
          </nav>

          <div className="mt-3 grid gap-8 lg:grid-cols-[573px_1fr]">
            <DesktopGallery artworks={nft.gallery} name={nft.name} current={view} onSelect={setView} />

            <section aria-labelledby="nft-title" className="flex flex-col justify-between gap-5">
              <div className="flex flex-col gap-3 border-b border-brand/40 pb-3">
                <h1 id="nft-title" className="text-[28px] leading-[37px] font-bold">
                  {nft.name}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[22px] leading-4">{price}</span>
                  <button
                    type="button"
                    onClick={openReviews}
                    className="flex items-center gap-1 text-[15px] leading-5 hover:text-brand-accent"
                  >
                    <RatingStars average={nft.rating.average} />
                    {nft.rating.count} avaliações de colecionadores
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-[15px] leading-4 font-bold">Sobre este NFT:</h2>
                <p className="text-sm leading-6 text-text-secondary">{nft.description}</p>
              </div>
              <EditionPicker editions={nft.editions} selected={edition.id} onSelect={setEdition} />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <QuantityStepper
                  value={purchase.quantity}
                  max={Math.max(purchase.limit, 1)}
                  onChange={purchase.setQuantity}
                  itemName={nft.name}
                  disabled={purchase.blockedReason !== null}
                />
                <div className="flex gap-2">
                  <Button
                    className="w-[130px]"
                    onClick={() => purchase.submit(true)}
                    disabled={purchase.blockedReason !== null}
                    aria-busy={purchase.isAdding}
                    aria-describedby="purchase-hint"
                  >
                    {purchase.isAdding ? 'ADICIONANDO…' : 'COMPRAR'}
                  </Button>
                  <FavoriteButton nftId={nft.id} nftName={nft.name} variant="full" className="w-[130px]" />
                </div>
              </div>
              <p
                id="purchase-hint"
                className={purchase.blockedReason ? 'text-sm text-coral' : 'text-xs text-text-secondary'}
                aria-live="polite"
              >
                {purchase.hint}
              </p>
              {tokenInfo}
              <ShareLinks name={nft.name} />
            </section>
          </div>

          <div className="mt-24">
            <DetailTabs nft={nft} tab={tab} onTabChange={setTab} />
          </div>
          <div className="mt-24">
            <NftCarousel title="Mais desta coleção" items={nft.related} headingId="related-heading" />
          </div>
        </Container>
      ) : (
        /* ---------- Mobile ---------- */
        <div>
          <div className="bg-linear-to-b from-surface-card to-surface-raised px-7 pt-6 pb-[90px]">
            <div className="mb-2 flex items-center justify-between">
              <BackButton />
              <FavoriteButton
                nftId={nft.id}
                nftName={nft.name}
                variant="round"
                className="size-[35px] rounded-full border-border bg-surface-raised text-brand-accent"
              />
            </div>
            <MobileGallery artworks={nft.gallery} name={nft.name} current={view} onSelect={setView} />
          </div>
          <section
            aria-labelledby="nft-title"
            className="-mt-[114px] flex flex-col gap-3 rounded-t-[31px] bg-surface-card px-6 pt-8 pb-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h1 id="nft-title" className="text-xl leading-4 font-bold">
                {nft.name}
              </h1>
              <button
                type="button"
                onClick={openReviews}
                className="flex h-[27px] items-center gap-1 rounded-[32px] border border-brand px-1.5 text-sm"
                aria-label={`Avaliação ${nft.rating.average.toLocaleString('pt-BR')} de 5, ${nft.rating.count} avaliações`}
              >
                <StarIcon aria-hidden className="size-3.5" color="var(--kurio-amber)" />
                <span className="font-medium">{nft.rating.average.toLocaleString('pt-BR')}</span>
                <span className="text-text-secondary">({nft.rating.count})</span>
              </button>
            </div>
            <p className="text-sm leading-6 text-text-secondary">{nft.description}</p>
            <EditionPicker editions={nft.editions} selected={edition.id} onSelect={setEdition} />
            {tokenInfo}
            <p
              className={purchase.blockedReason ? 'text-sm text-coral' : 'text-xs text-text-secondary'}
              aria-live="polite"
            >
              {purchase.hint}
            </p>
          </section>
          <div className="px-6 pt-8 pb-6">
            <DetailTabs nft={nft} tab={tab} onTabChange={setTab} />
            <div className="mt-12">
              <NftCarousel title="Mais desta coleção" items={nft.related} headingId="related-heading" />
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[40px] bg-surface-card px-6 pt-5 pb-[max(36px,env(safe-area-inset-bottom))] shadow-overlay">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[15px] leading-4 font-medium text-text-secondary">Qtd.</span>
                <QuantityStepper
                  size="md"
                  value={purchase.quantity}
                  max={Math.max(purchase.limit, 1)}
                  onChange={purchase.setQuantity}
                  itemName={nft.name}
                  disabled={purchase.blockedReason !== null}
                />
              </div>
              <span className="text-xl leading-4">{price}</span>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button
                variant="pill"
                className="h-15 w-[196px] text-base"
                onClick={() => purchase.submit(true)}
                disabled={purchase.blockedReason !== null}
                aria-busy={purchase.isAdding}
              >
                Comprar NFT
              </Button>
              <button
                type="button"
                onClick={() => purchase.submit(false)}
                disabled={purchase.blockedReason !== null || purchase.isAdding}
                aria-label={`Adicionar ${nft.name} ao carrinho`}
                className="grid size-15 place-items-center rounded-full border border-border bg-surface-raised disabled:opacity-40"
              >
                <ShopIcon aria-hidden className="size-5" color="var(--kurio-secondary)" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function BackButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.history.back() : void router.navigate({ to: '/' }))}
      aria-label="Voltar"
      className="grid size-[35px] place-items-center rounded-full border border-border bg-surface-raised"
    >
      <ArrowLeft2Icon aria-hidden className="size-5" />
    </button>
  )
}

function DetailSkeleton() {
  return (
    <main aria-busy="true" aria-label="Carregando NFT">
      <Container className="hidden pt-8 md:block">
        <div className="skeleton h-4 w-36" />
        <div className="mt-3 grid gap-8 lg:grid-cols-[573px_1fr]">
          <div className="flex items-center gap-7">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="skeleton size-[100px]" />
              ))}
            </div>
            <div className="skeleton aspect-square w-full max-w-[444px]" />
          </div>
          <div className="flex flex-col gap-5">
            <div className="skeleton h-9 w-2/3" />
            <div className="skeleton h-5 w-full" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-14 w-1/2" />
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-24 w-1/2" />
          </div>
        </div>
      </Container>
      <div className="md:hidden">
        <div className="px-7 pt-6">
          <div className="skeleton aspect-[361/356] w-full rounded-3xl" />
        </div>
        <div className="flex flex-col gap-3 px-6 pt-8">
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-7 w-1/2" />
        </div>
      </div>
      <span className="sr-only" role="status">
        Carregando NFT…
      </span>
    </main>
  )
}

function NftNotFound() {
  return (
    <main className="py-24">
      <Container className="flex flex-col items-start gap-4">
        <p className="text-sm font-bold tracking-[0.1em] text-brand-accent">NFT INEXISTENTE</p>
        <h1 className="text-[28px] leading-[37px] font-bold">Não encontramos este NFT</h1>
        <p className="max-w-prose text-text-secondary">
          Ele pode ter sido removido do mercado ou o endereço está incorreto.
        </p>
        <Button asChild>
          <Link to="/" hash="mercado">
            Explorar o mercado
          </Link>
        </Button>
      </Container>
    </main>
  )
}
