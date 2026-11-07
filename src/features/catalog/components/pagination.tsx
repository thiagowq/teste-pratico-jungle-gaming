import { ArrowLeft2Icon, ArrowRight2Icon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** Janela de até 4 páginas ao redor da atual, como no layout (1 2 3 4 →). */
function pageWindow(current: number, total: number, size = 4) {
  const start = Math.max(1, Math.min(current - 1, total - size + 1))
  return Array.from({ length: Math.min(size, total) }, (_, index) => start + index)
}

const cell = 'grid size-[35px] place-items-center rounded-[4px] text-lg leading-4 transition-colors'

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginação do catálogo" className={cn('flex justify-end', className)}>
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              className={cn(cell, 'border border-border hover:border-brand')}
              aria-label="Página anterior"
            >
              <ArrowLeft2Icon aria-hidden className="size-[18px]" color="var(--kurio-foreground)" />
            </button>
          </li>
        )}
        {pageWindow(page, totalPages).map((number) => {
          const current = number === page
          return (
            <li key={number}>
              <button
                type="button"
                onClick={() => onPageChange(number)}
                aria-current={current ? 'page' : undefined}
                aria-label={`Página ${number}`}
                className={cn(
                  cell,
                  current ? 'bg-brand font-bold text-ink' : 'border border-border text-foreground hover:border-brand',
                )}
              >
                {number}
              </button>
            </li>
          )
        })}
        {page < totalPages && (
          <li>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              className={cn(cell, 'border border-border hover:border-brand')}
              aria-label="Próxima página"
            >
              <ArrowRight2Icon aria-hidden className="size-[18px]" />
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}
