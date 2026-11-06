import { useState } from 'react'
import Decimal from 'decimal.js'
import { CATEGORY_LABELS, type Category, type NftListParams, type NftListResponse } from '@/api/contracts/catalog'
import { NETWORK_LABELS, type Network } from '@/api/contracts/common'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { formatEthPtBr } from '@/lib/format'
import { cn } from '@/lib/utils'

interface CatalogFiltersProps {
  params: NftListParams
  facets: NftListResponse['facets'] | undefined
  onChange: (patch: Partial<NftListParams>) => void
}

function toggle<T>(list: T[] | undefined, value: T) {
  const next = list?.includes(value) ? list.filter((item) => item !== value) : [...(list ?? []), value]
  return next.length ? next : undefined
}

function FacetList<T extends string>({
  label,
  items,
  selected,
  labels,
  onToggle,
  countClassName,
}: {
  label: string
  items: Array<{ id: T; count: number }> | undefined
  selected: T[] | undefined
  labels: Record<T, string>
  onToggle: (id: T) => void
  countClassName?: string
}) {
  return (
    <ul aria-label={label} className="flex flex-col">
      {(items ?? (Object.keys(labels) as T[]).map((id) => ({ id, count: -1 }))).map((item) => {
        const active = selected?.includes(item.id) ?? false
        return (
          <li key={item.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(item.id)}
              className={cn(
                'flex h-10 w-full items-center justify-between gap-3 rounded-sm text-left text-[15px] leading-10 transition-colors hover:text-brand-accent',
                active ? 'text-brand-accent' : 'text-text-secondary',
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn('size-1.5 rounded-full transition-colors', active ? 'bg-brand' : 'bg-transparent')}
                />
                {labels[item.id]}
              </span>
              {item.count >= 0 && (
                <span className={cn(countClassName, active && 'font-bold')}>
                  <span className="sr-only">, </span>({item.count})
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function PriceFilter({ params, facets, onChange }: CatalogFiltersProps) {
  const min = Number(facets?.priceRange.min ?? 0)
  const max = Number(facets?.priceRange.max ?? 0)
  const applied: [number, number] = [Number(params.minPrice ?? min), Number(params.maxPrice ?? max)]
  const [draft, setDraft] = useState<[number, number] | null>(null)
  const value = draft ?? applied
  const disabled = !facets || max <= min

  return (
    <div className="flex flex-col gap-3 pl-3">
      <Slider
        min={min}
        max={max}
        step={0.01}
        value={value}
        disabled={disabled}
        onValueChange={(next) => setDraft([next[0], next[1]])}
        aria-label="Faixa de preço"
        thumbLabels={['Preço mínimo', 'Preço máximo']}
      />
      <p className="text-[15px] leading-5" aria-live="polite">
        Preço: {formatEthPtBr(String(value[0]))} - {formatEthPtBr(String(value[1]))} ETH
      </p>
      <Button
        size="sm"
        className="w-fit"
        disabled={disabled || draft === null}
        onClick={() => {
          if (!draft) return
          const [low, high] = draft.map((amount) => new Decimal(amount).toFixed(2))
          onChange({
            minPrice: Number(low) <= min ? undefined : low,
            maxPrice: Number(high) >= max ? undefined : high,
          })
          setDraft(null)
        }}
      >
        Aplicar
      </Button>
    </div>
  )
}

/** Filtros combináveis do catálogo. Toda mudança vai para a URL e reinicia a paginação. */
export function CatalogFilters({ params, facets, onChange, className }: CatalogFiltersProps & { className?: string }) {
  const hasFilters = Boolean(params.categories?.length || params.networks?.length || params.minPrice || params.maxPrice)
  return (
    <div className={cn('flex flex-col gap-10', className)}>
      <section aria-labelledby="filter-collections" className="flex flex-col gap-3">
        <h2 id="filter-collections" className="text-lg leading-4 font-bold">
          Coleções
        </h2>
        <div className="px-3">
          <FacetList<Category>
            label="Coleções"
            items={facets?.categories}
            selected={params.categories}
            labels={CATEGORY_LABELS}
            onToggle={(id) => onChange({ categories: toggle(params.categories, id) })}
            countClassName="font-bold"
          />
        </div>
      </section>

      <section aria-labelledby="filter-price" className="flex flex-col gap-3">
        <h2 id="filter-price" className="text-lg leading-4 font-bold">
          Faixa de preço
        </h2>
        {/* `key` reinicia o rascunho quando a faixa aplicada muda pela URL. */}
        <PriceFilter key={`${params.minPrice}-${params.maxPrice}`} params={params} facets={facets} onChange={onChange} />
      </section>

      <section aria-labelledby="filter-network" className="flex flex-col gap-3">
        <h2 id="filter-network" className="text-lg leading-4 font-bold">
          Rede
        </h2>
        <div className="pl-3">
          <FacetList<Network>
            label="Rede"
            items={facets?.networks}
            selected={params.networks}
            labels={NETWORK_LABELS}
            onToggle={(id) => onChange({ networks: toggle(params.networks, id) })}
          />
        </div>
      </section>

      {hasFilters && (
        <Button
          variant="link"
          className="w-fit"
          onClick={() => onChange({ categories: undefined, networks: undefined, minPrice: undefined, maxPrice: undefined })}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
