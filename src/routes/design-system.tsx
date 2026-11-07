import { createFileRoute, notFound } from '@tanstack/react-router'
import { NftImage, type NftArtwork } from '@/components/nft-image'
import { Button } from '@/components/ui/button'

/**
 * Vitrine dos tokens, ícones e imagens extraídos do Figma. Disponível apenas em
 * desenvolvimento, para conferência visual; em produção responde 404.
 */
export const Route = createFileRoute('/design-system')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: DesignSystemPage,
})

const icons = import.meta.glob<React.FC<React.SVGProps<SVGSVGElement>>>('../assets/icons/*.svg', {
  query: '?react',
  import: 'default',
  eager: true,
})

const colors = [
  ['ink', '#140d0a'],
  ['surface-card', '#241612'],
  ['surface-raised', '#2f1d15'],
  ['surface-dark', '#38220f'],
  ['border', '#3f2319'],
  ['border-soft', '#55321f'],
  ['foreground', '#f5f1eb'],
  ['brand', '#d28a4c'],
  ['brand-accent', '#e89b55'],
  ['text-secondary', '#cfb28c'],
  ['tan', '#b39463'],
  ['coral', '#f0805f'],
  ['amber', '#e3a44e'],
  ['success', '#00a66c'],
  ['error', '#ed1b2e'],
] as const

const artworks: NftArtwork[] = ['ape-emerald', 'gorilla-nomad', 'ape-baron', 'ape-golden']

function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-page space-y-12 px-4 py-10">
      <h1 className="text-[43px] leading-[70px] font-bold">Design system Kurio</h1>

      <section aria-labelledby="ds-colors" className="space-y-4">
        <h2 id="ds-colors" className="text-2xl font-bold">
          Cores
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {colors.map(([name, hex]) => (
            <li key={name} className="rounded-md border border-border p-2 text-xs">
              <span className="mb-2 block h-12 rounded-sm border border-border-soft" style={{ background: hex }} />
              {name}
              <br />
              <span className="text-text-secondary">{hex}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ds-type" className="space-y-3">
        <h2 id="ds-type" className="text-2xl font-bold">
          Tipografia (Roboto Mono)
        </h2>
        <p className="text-[43px] leading-[70px] font-bold">SEJA DONO DO FUTURO</p>
        <p className="text-[28px] leading-[37px] font-bold">Heading 28 Bold</p>
        <p className="text-lg font-bold text-brand-accent">1.19 ETH</p>
        <p className="text-[15px] leading-5">Body 15 Regular — Emerald Ape #042</p>
        <p className="text-sm leading-6 text-text-secondary">Body 14 Regular · lh 24 — texto secundário</p>
      </section>

      <section aria-labelledby="ds-buttons" className="flex flex-wrap items-center gap-3">
        <h2 id="ds-buttons" className="sr-only">
          Botões
        </h2>
        <Button>COMPRAR</Button>
        <Button variant="outline">Favoritar</Button>
        <Button variant="ghost">Continuar explorando</Button>
      </section>

      <section aria-labelledby="ds-icons" className="space-y-4">
        <h2 id="ds-icons" className="text-2xl font-bold">
          Ícones ({Object.keys(icons).length})
        </h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Object.entries(icons).map(([path, Icon]) => (
            <li key={path} className="flex flex-col items-center gap-2 rounded-md bg-surface-card p-3 text-[10px]">
              <Icon aria-hidden />
              {path.split('/').pop()?.replace('.svg', '')}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ds-art" className="space-y-4">
        <h2 id="ds-art" className="text-2xl font-bold">
          Artes
        </h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {artworks.map((artwork) => (
            <li key={artwork} className="overflow-hidden rounded-xl bg-surface-card p-3">
              <NftImage artwork={artwork} alt={artwork} sizes="(min-width: 640px) 25vw, 50vw" className="rounded-lg" />
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-4 gap-4">
          {artworks.map((artwork) => (
            <div key={artwork} className="skeleton aspect-square" aria-hidden />
          ))}
        </div>
      </section>
    </main>
  )
}
