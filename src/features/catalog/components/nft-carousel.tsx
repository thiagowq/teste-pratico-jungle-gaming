import { useEffect, useRef, useState } from 'react'
import type { NftSummary } from '@/api/contracts/catalog'
import { cn } from '@/lib/utils'
import { NftCard } from './nft-card'

/**
 * Faixa horizontal de NFTs com rolagem por "snap" e indicadores de página,
 * como "Mais desta coleção" e "Colecionadores também viram". Os indicadores
 * aparecem quando há mais itens do que cabem na largura.
 */
export function NftCarousel({ title, items, headingId }: { title: string; items: NftSummary[]; headingId: string }) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => {
      setPages(Math.max(1, Math.ceil(track.scrollWidth / track.clientWidth - 0.05)))
      setPage(Math.round(track.scrollLeft / track.clientWidth))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    track.addEventListener('scroll', measure, { passive: true })
    return () => {
      observer.disconnect()
      track.removeEventListener('scroll', measure)
    }
  }, [items.length])

  if (items.length === 0) return null

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-8">
      <div className="border-b border-brand/40 pb-3">
        <h2 id={headingId} className="text-[17px] leading-4 font-bold text-brand-accent">
          {title}
        </h2>
      </div>
      <ul
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto scroll-smooth px-4 pb-2 md:mx-0 md:gap-7 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((nft) => (
          <li key={nft.id} className="w-[46%] shrink-0 snap-start sm:w-[30%] lg:w-[calc((100%-4*28px)/5)]">
            <NftCard nft={nft} size="sm" imageSizes="(min-width: 1024px) 219px, 45vw" />
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="flex justify-center gap-1" role="group" aria-label={`Páginas de ${title}`}>
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Página ${index + 1} de ${pages}`}
              aria-current={index === page ? 'true' : undefined}
              onClick={() => trackRef.current?.scrollTo({ left: index * trackRef.current.clientWidth })}
              className="grid size-6 place-items-center"
            >
              <span className={cn('size-3 rounded-full border border-brand', index === page && 'bg-brand')} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
