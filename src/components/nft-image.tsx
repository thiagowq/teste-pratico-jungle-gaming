import { cn } from '@/lib/utils'

/** Larguras geradas por `npm run images` (scripts/optimize-images.mjs). */
const WIDTHS = [160, 320, 480, 640, 960, 1254] as const

export type NftArtwork = 'ape-emerald' | 'gorilla-nomad' | 'ape-baron' | 'ape-golden'

function srcSet(artwork: string, format: 'avif' | 'webp') {
  return WIDTHS.map((width) => `/images/nfts/${artwork}-${width}.${format} ${width}w`).join(', ')
}

interface NftImageProps {
  artwork: NftArtwork | string
  alt: string
  /** Tamanho exibido, para o navegador escolher a variante (atributo `sizes`). */
  sizes: string
  className?: string
  /** Imagem acima da dobra (LCP): carrega com prioridade. */
  priority?: boolean
}

/** Arte quadrada do NFT em AVIF/WebP responsivo, sem deslocamento de layout. */
export function NftImage({ artwork, alt, sizes, className, priority = false }: NftImageProps) {
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(artwork, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(artwork, 'webp')} sizes={sizes} />
      <img
        src={`/images/nfts/${artwork}-640.webp`}
        alt={alt}
        width={1254}
        height={1254}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={cn('aspect-square size-full object-cover', className)}
      />
    </picture>
  )
}
