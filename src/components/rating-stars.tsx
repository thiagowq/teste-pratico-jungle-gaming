import { StarIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** Cinco estrelas: as cheias (parte inteira da média) em laranja, as demais em tom claro. */
export function RatingStars({ average, className }: { average: number; className?: string }) {
  const filled = Math.floor(average)
  return (
    <span
      role="img"
      aria-label={`Avaliação ${average.toLocaleString('pt-BR')} de 5`}
      className={cn('inline-flex gap-1', className)}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={index}
          aria-hidden
          className="size-[15px]"
          color={index < filled ? 'var(--kurio-primary)' : 'var(--kurio-text-secondary)'}
        />
      ))}
    </span>
  )
}
