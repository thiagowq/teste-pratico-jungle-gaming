import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from '@/components/icons'
import { NftImage, type NftArtwork } from '@/components/nft-image'
import { cn } from '@/lib/utils'

interface Slide {
  eyebrow: string
  title: [string, string]
  mobileTitle: [string, string]
  text: string
  mobileText: string
  artwork: NftArtwork
  secondary: NftArtwork
  alt: string
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'Bem-vindo à Kurio',
    title: ['SEJA DONO DO FUTURO', 'DA ARTE DIGITAL'],
    mobileTitle: ['SEJA DONO DA', 'CULTURA DIGITAL'],
    text: 'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    mobileText: 'Descubra NFTs selecionados de criadores do mundo todo.',
    artwork: 'ape-emerald',
    secondary: 'gorilla-nomad',
    alt: 'Emerald Ape: macaco ilustrado com óculos redondos e jaqueta college verde',
  },
  {
    eyebrow: 'Lançamentos gênesis',
    title: ['EDIÇÕES ESCASSAS', 'DIRETO DOS CRIADORES'],
    mobileTitle: ['EDIÇÕES', 'ESCASSAS'],
    text: 'Garanta edições 1/1 e 1/10 antes da revelação pública, com procedência verificada na rede.',
    mobileText: 'Garanta edições limitadas antes da revelação.',
    artwork: 'ape-golden',
    secondary: 'ape-baron',
    alt: 'Golden Beat: macaco dourado com fones de ouvido verdes',
  },
  {
    eyebrow: 'Coleções verificadas',
    title: ['ARTE DIGITAL', 'COM PROCEDÊNCIA'],
    mobileTitle: ['ARTE COM', 'PROCEDÊNCIA'],
    text: 'Cada obra tem contrato verificado, metadados imutáveis e direitos autorais para quem cria.',
    mobileText: 'Contratos verificados e metadados imutáveis.',
    artwork: 'ape-baron',
    secondary: 'ape-emerald',
    alt: 'Ivory Baron: macaco de pelagem escura com blazer claro e gola alta verde',
  },
]

function Dots({
  current,
  onSelect,
  className,
}: {
  current: number
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-2', className)} role="group" aria-label="Destaques">
      {SLIDES.map((slide, index) => (
        <button
          key={slide.eyebrow}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Destaque ${index + 1} de ${SLIDES.length}: ${slide.eyebrow}`}
          aria-current={index === current ? 'true' : undefined}
          className="grid size-6 place-items-center rounded-full"
        >
          <span
            className={cn(
              'block rounded-full bg-brand transition-all',
              index === current ? 'size-2' : 'size-2 opacity-40',
              'max-md:size-[7px]',
            )}
          />
        </button>
      ))}
    </div>
  )
}

/** Hero com três destaques navegáveis (sem rotação automática, para não mover conteúdo sozinho). */
export function Hero() {
  const [current, setCurrent] = useState(0)
  const slide = SLIDES[current]

  return (
    <section aria-roledescription="carrossel" aria-label="Destaques do marketplace">
      {/* Desktop / tablet */}
      <div className="hidden min-h-[450px] items-center justify-between gap-10 md:flex lg:gap-[110px] lg:pl-10">
        <div className="flex max-w-[600px] flex-col items-end gap-11" aria-live="polite">
          <div className="flex w-full flex-col gap-8">
            <div className="flex flex-col gap-1">
              <p className="text-sm leading-4 font-medium tracking-[0.1em]">{slide.eyebrow}</p>
              <h1 className="mt-2 text-[32px] leading-[52px] font-bold lg:text-[43px] lg:leading-[70px]">
                {slide.title[0]}
                <br />
                {slide.title[1]}
              </h1>
              <p className="max-w-[557px] text-sm leading-6 text-text-secondary">{slide.text}</p>
            </div>
            <Link
              to="/"
              hash="mercado"
              className="inline-flex h-10 w-[140px] items-center justify-center rounded-md bg-brand text-base leading-5 font-bold text-ink hover:brightness-110"
            >
              EXPLORAR
            </Link>
          </div>
          <Dots current={current} onSelect={setCurrent} />
        </div>
        <div className="aspect-square w-[min(450px,42vw)] shrink-0 overflow-hidden rounded-3xl">
          <NftImage
            artwork={slide.artwork}
            alt={slide.alt}
            sizes="(min-width: 1200px) 450px, 42vw"
            priority
            className="size-full"
          />
        </div>
      </div>

      {/* Mobile */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-brand/20 to-brand/10 p-4 md:hidden">
        <span
          aria-hidden
          className="absolute -top-8 -left-20 size-[248px] rounded-full bg-linear-to-b from-[#dd9a5f]/40 to-transparent"
        />
        <span
          aria-hidden
          className="absolute -top-2.5 left-[73px] size-[248px] rounded-full bg-linear-to-b from-[#dd9a5f]/35 to-transparent"
        />
        <div className="relative flex items-center gap-2" aria-live="polite">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-xs leading-4 font-medium">{slide.eyebrow}</p>
            <h1 className="mt-1.5 text-lg leading-[29px] font-bold">
              {slide.mobileTitle[0]}
              <br />
              {slide.mobileTitle[1]}
            </h1>
            <p className="mt-1.5 text-xs leading-[18px] text-text-secondary">{slide.mobileText}</p>
            <Link
              to="/"
              hash="mercado"
              className="mt-1 flex items-center gap-2 text-xs leading-[14px] font-bold text-brand-accent"
            >
              EXPLORAR
              <ArrowRightIcon aria-hidden className="size-4" color="var(--kurio-primary)" />
            </Link>
          </div>
          <div className="relative h-[146px] w-[138px] shrink-0">
            <div className="size-[138px] overflow-hidden rounded-2xl">
              <NftImage artwork={slide.artwork} alt={slide.alt} sizes="138px" priority className="size-full" />
            </div>
            <div className="absolute bottom-0 left-3.5 size-[58px] overflow-hidden rounded-2xl ring-2 ring-surface-card">
              <NftImage artwork={slide.secondary} alt="" sizes="58px" className="size-full" />
            </div>
          </div>
        </div>
        <Dots current={current} onSelect={setCurrent} className="relative mt-1 justify-center gap-0" />
      </div>
    </section>
  )
}
