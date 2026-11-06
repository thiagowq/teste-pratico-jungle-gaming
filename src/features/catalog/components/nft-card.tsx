import { Link } from '@tanstack/react-router'
import { CardZoomIcon } from '@/components/icons'
import { NftImage } from '@/components/nft-image'
import type { NftSummary } from '@/api/contracts/catalog'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { formatEth } from '@/lib/format'
import { cn } from '@/lib/utils'

interface NftCardProps {
  nft: NftSummary
  /** `sizes` da imagem para o contexto em que o card aparece. */
  imageSizes?: string
  priority?: boolean
  /** Ações extras no rodapé da imagem (ex.: adicionar ao carrinho). */
  actions?: React.ReactNode
  /** `sm`: variante dos carrosséis (nome 15/20, preço 16). */
  size?: 'md' | 'sm'
  className?: string
}

function Badge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'absolute top-3.5 left-0 z-10 flex h-[29px] w-20 items-center bg-brand pl-[15px] text-base leading-4 font-medium text-ink max-md:h-8 max-md:w-[68px] max-md:pl-2 max-md:text-[13px]',
        className,
      )}
    >
      RARO
    </span>
  )
}

/**
 * Card do NFT. Desktop (≥ 768px): caixa 258×300 com arte 250×250 e ações no
 * hover/foco. Mobile: caixa com gradiente, arte arredondada e favorito no canto.
 */
export function NftCard({ nft, imageSizes, priority, actions, size = 'md', className }: NftCardProps) {
  const unavailable = nft.available === 0
  return (
    <article className={cn('group relative', className)} aria-labelledby={`nft-${nft.id}-name`}>
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden bg-surface-card',
          'aspect-[258/300] max-md:aspect-[175/200] max-md:items-start max-md:rounded-[20px] max-md:bg-linear-to-b max-md:from-surface-card max-md:to-surface-raised max-md:px-1 max-md:pt-3',
        )}
      >
        {nft.badge === 'raro' && <Badge />}
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          tabIndex={-1}
          aria-hidden
          className="block w-[96.9%] max-md:w-full"
        >
          <NftImage
            artwork={nft.artwork}
            alt=""
            sizes={imageSizes ?? '(min-width: 1200px) 250px, (min-width: 768px) 30vw, 45vw'}
            priority={priority}
            className={cn('rounded-[15px] max-md:rounded-2xl', unavailable && 'opacity-50 grayscale')}
          />
        </Link>

        <div
          className={cn(
            'absolute bottom-[25px] left-1/2 z-10 flex -translate-x-1/2 gap-2.5 transition-opacity max-md:hidden',
            'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100',
          )}
        >
          {actions}
          <FavoriteButton nftId={nft.id} nftName={nft.name} />
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            aria-label={`Ver detalhes de ${nft.name}`}
            className="grid size-[35px] place-items-center rounded-sm border border-border bg-surface-raised text-foreground hover:border-brand"
          >
            <CardZoomIcon aria-hidden color="currentColor" className="size-5" />
          </Link>
        </div>

        <FavoriteButton nftId={nft.id} nftName={nft.name} variant="round" className="absolute top-5 right-3 z-10 md:hidden" />
      </div>

      <div className={cn('mt-3 flex flex-col max-md:mt-2 max-md:gap-0 max-md:pl-2', size === 'sm' ? 'gap-0' : 'gap-3')}>
        <h3
          id={`nft-${nft.id}-name`}
          className={cn('text-base leading-4 max-md:text-[15px] max-md:leading-5', size === 'sm' && 'text-[15px] leading-5')}
        >
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 after:content-[''] hover:text-brand-accent focus-visible:outline-none"
          >
            {nft.name}
          </Link>
        </h3>
        <p
          className={cn(
            'flex flex-wrap items-center gap-x-3 gap-y-1 text-lg leading-4 whitespace-nowrap max-md:gap-x-2 max-md:text-base',
            size === 'sm' && 'text-base',
          )}
        >
          <span className="font-bold text-brand-accent">
            <span className="sr-only">Preço: </span>
            {formatEth(nft.priceEth)}
          </span>
          {nft.previousPriceEth && (
            <s className="text-tan">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.previousPriceEth)}
            </s>
          )}
          {unavailable && <span className="text-sm text-coral">Esgotado</span>}
        </p>
      </div>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[258/300] rounded-none max-md:aspect-[175/200] max-md:rounded-[20px]" />
      <div className="skeleton mt-3 h-4 w-3/4" />
      <div className="skeleton mt-3 h-4 w-1/3" />
    </div>
  )
}
