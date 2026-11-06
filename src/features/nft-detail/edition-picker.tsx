import type { Edition, EditionId } from '@/api/contracts/catalog'
import { cn } from '@/lib/utils'

/** Seleção de edição em "chips". Edições esgotadas ficam riscadas e não selecionáveis. */
export function EditionPicker({
  editions,
  selected,
  onSelect,
  className,
}: {
  editions: Edition[]
  selected: EditionId
  onSelect: (id: EditionId) => void
  className?: string
}) {
  return (
    <fieldset className={className}>
      <legend className="text-[15px] leading-4 font-bold">Edição:</legend>
      <div className="mt-3 flex flex-wrap gap-1.5 max-md:mt-2 max-md:gap-3" role="radiogroup" aria-label="Edição">
        {editions.map((edition) => {
          const active = edition.id === selected
          const soldOut = edition.available === 0
          return (
            <button
              key={edition.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={soldOut || undefined}
              aria-label={`Edição ${edition.label}${soldOut ? ', esgotada' : `, ${edition.available} disponíveis`}`}
              onClick={() => !soldOut && onSelect(edition.id)}
              className={cn(
                'h-7 rounded-full border px-1.5 text-sm leading-4 transition-colors',
                active ? 'border-brand font-medium text-brand-accent' : 'border-border text-text-secondary hover:border-brand',
                soldOut && 'cursor-not-allowed line-through opacity-50 hover:border-border',
                edition.id === 'open' && 'px-2',
              )}
            >
              {edition.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
