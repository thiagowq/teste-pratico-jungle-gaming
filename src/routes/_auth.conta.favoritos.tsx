import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { useFavorites } from '@/features/favorites/use-favorites'

export const Route = createFileRoute('/_auth/conta/favoritos')({
  head: () => ({ meta: [{ title: 'Lista de interesse | Kurio' }] }),
  component: FavoritesPage,
})

/** "Lista de interesse": NFTs favoritados pelo usuário autenticado. */
function FavoritesPage() {
  const query = useFavorites()
  const items = query.data?.items ?? []

  return (
    <section aria-labelledby="favorites-heading" className="flex flex-col gap-6">
      <h1 id="favorites-heading" className="text-base leading-4 font-bold">
        Lista de interesse
      </h1>
      {query.isPending ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3" aria-hidden>
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p>Não foi possível carregar seus favoritos.</p>
          <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-border bg-surface-card p-6">
          <p className="font-bold">Nenhum favorito ainda</p>
          <p className="text-sm text-text-secondary">Toque no coração de um NFT para guardá-lo aqui.</p>
          <Button asChild>
            <Link to="/" hash="mercado">
              Explorar NFTs
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-[34px]">
          {items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
