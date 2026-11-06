import { useState } from 'react'
import { CardZoomIcon } from '@/components/icons'
import { NftImage } from '@/components/nft-image'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { Artwork } from '@/api/contracts/catalog'
import { cn } from '@/lib/utils'

/**
 * Enquadramentos da galeria: a obra inteira e recortes de detalhe da mesma
 * arte (rosto, acessório). O layout repete a arte nas miniaturas; aqui cada
 * miniatura mostra um ponto de vista diferente para a galeria ter função.
 */
const VIEWS = [
  { label: 'Obra completa', className: '' },
  { label: 'Detalhe do rosto', className: 'scale-[1.6] object-[50%_30%]' },
  { label: 'Detalhe do acessório', className: 'scale-[1.8] object-[50%_85%]' },
  { label: 'Fundo e composição', className: 'scale-[1.25] object-[50%_50%]' },
]

function Framed({
  artwork,
  view,
  sizes,
  priority,
  alt,
  className,
}: {
  artwork: Artwork
  view: number
  sizes: string
  priority?: boolean
  alt: string
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <NftImage
        artwork={artwork}
        alt={alt}
        sizes={sizes}
        priority={priority}
        className={cn('size-full transition-transform duration-300', VIEWS[view % VIEWS.length].className)}
      />
    </div>
  )
}

export function DesktopGallery({
  artworks,
  name,
  current,
  onSelect,
}: {
  artworks: Artwork[]
  name: string
  current: number
  onSelect: (index: number) => void
}) {
  const [zoomOpen, setZoomOpen] = useState(false)
  return (
    <div className="flex items-center gap-7">
      <ul className="flex shrink-0 flex-col gap-4" aria-label="Miniaturas da galeria">
        {artworks.map((artwork, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`${VIEWS[index % VIEWS.length].label} de ${name}`}
              aria-current={index === current ? 'true' : undefined}
              className={cn(
                'block size-[100px] overflow-hidden rounded-md bg-surface-card',
                index === current && 'ring-1 ring-brand',
              )}
            >
              <Framed artwork={artwork} view={index} sizes="100px" alt="" className="size-full rounded-lg" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative aspect-square w-full max-w-[444px] rounded-md bg-surface-card p-4">
        <Framed
          artwork={artworks[current]}
          view={current}
          sizes="(min-width: 1200px) 404px, 40vw"
          priority
          alt={`${name}: ${VIEWS[current % VIEWS.length].label.toLowerCase()}`}
          className="size-full rounded-3xl"
        />
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={`Ampliar imagem de ${name}`}
          className="absolute top-3 right-3 grid size-[30px] place-items-center rounded-full border border-border bg-surface-raised text-foreground hover:border-brand"
        >
          <CardZoomIcon aria-hidden className="size-5" color="currentColor" />
        </button>
      </div>
      <ZoomDialog open={zoomOpen} onOpenChange={setZoomOpen} artwork={artworks[current]} view={current} name={name} />
    </div>
  )
}

export function MobileGallery({
  artworks,
  name,
  current,
  onSelect,
}: {
  artworks: Artwork[]
  name: string
  current: number
  onSelect: (index: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Framed
        artwork={artworks[current]}
        view={current}
        sizes="92vw"
        priority
        alt={`${name}: ${VIEWS[current % VIEWS.length].label.toLowerCase()}`}
        className="aspect-[361/356] w-full rounded-3xl"
      />
      <div className="flex items-center gap-1" role="group" aria-label="Imagens da galeria">
        {artworks.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`${VIEWS[index % VIEWS.length].label} de ${name}`}
            aria-current={index === current ? 'true' : undefined}
            className="grid h-6 place-items-center px-1"
          >
            <span
              className={cn(
                'block h-[7px] rounded-full bg-brand transition-all',
                index === current ? 'w-7' : 'w-[7px]',
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function ZoomDialog({
  open,
  onOpenChange,
  artwork,
  view,
  name,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  artwork: Artwork
  view: number
  name: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(92vw,820px)] p-4 sm:max-w-[min(92vw,820px)]">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <DialogDescription className="sr-only">Imagem ampliada: {VIEWS[view % VIEWS.length].label}</DialogDescription>
        <Framed
          artwork={artwork}
          view={view}
          sizes="820px"
          alt={`${name} ampliado`}
          className="aspect-square w-full rounded-2xl"
        />
      </DialogContent>
    </Dialog>
  )
}
