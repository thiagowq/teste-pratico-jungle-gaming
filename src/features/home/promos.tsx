import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from '@/components/icons'
import { NftImage, type NftArtwork } from '@/components/nft-image'

const PROMOS: Array<{ title: [string, string]; text: string; artwork: NftArtwork; tab: 'new' | 'trending'; cta: string }> = [
  {
    title: ['Lançamentos gênesis', 'de edição limitada'],
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    artwork: 'ape-emerald',
    tab: 'new',
    cta: 'Explorar lançamentos gênesis',
  },
  {
    title: ['Arte digital selecionada', 'e muito mais'],
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    artwork: 'ape-baron',
    tab: 'trending',
    cta: 'Explorar arte digital selecionada',
  },
]

export function Promos() {
  return (
    <section aria-label="Coleções em destaque" className="grid gap-7 lg:grid-cols-2">
      {PROMOS.map((promo) => (
        <article key={promo.tab} className="relative flex h-[250px] overflow-hidden rounded-lg bg-surface-card max-sm:h-auto max-sm:flex-col">
          <span aria-hidden className="absolute -bottom-[148px] -left-[191px] size-64 rounded-full border-2 border-brand" />
          <span aria-hidden className="absolute -bottom-[140px] -left-[199px] size-64 rounded-full border border-brand" />
          <div className="relative w-1/2 shrink-0 overflow-hidden rounded-[18px] max-sm:aspect-square max-sm:w-full lg:w-[292px]">
            <NftImage artwork={promo.artwork} alt="" sizes="(min-width: 1024px) 292px, 50vw" className="size-full" />
          </div>
          <div className="relative flex flex-1 flex-col items-end gap-3.5 pt-[37px] pr-[30px] pb-[46px] pl-0 text-right max-sm:p-5">
            <h2 className="text-lg leading-6 font-bold">
              {promo.title[0]}
              <br />
              {promo.title[1]}
            </h2>
            <p className="max-w-[263px] text-sm leading-6 text-text-secondary">{promo.text}</p>
            <Link
              to="/"
              search={{ tab: promo.tab }}
              hash="mercado"
              aria-label={promo.cta}
              className="mt-auto inline-flex h-10 w-[140px] shrink-0 items-center justify-center gap-1 rounded-md bg-brand text-sm leading-5 font-medium text-ink hover:brightness-110"
            >
              Explorar
              <ArrowRightIcon aria-hidden className="size-[18px]" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}
