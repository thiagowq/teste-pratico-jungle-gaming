import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  /** Nome do item, para rótulos acessíveis ("Diminuir quantidade de Emerald Ape #042"). */
  itemName: string
  size?: 'lg' | 'md' | 'sm'
  disabled?: boolean
  className?: string
}

const SIZES = {
  // Detalhe desktop: botões 33×50, número 20/28.
  lg: { button: 'h-[50px] w-[33px] rounded-[33px]', icon: 'w-[15px]', value: 'min-w-[13px] text-xl leading-7' },
  // Detalhe mobile: botões 20×30, número 18/25.
  md: { button: 'h-[30px] w-5 rounded-[20px]', icon: 'w-2.5', value: 'min-w-[11px] text-lg leading-[25px] font-medium' },
  // Carrinho: botões 20×30 compactos.
  sm: { button: 'h-[26px] w-[18px] rounded-[20px]', icon: 'w-2', value: 'min-w-4 text-base leading-5' },
} as const

function Minus({ className }: { className: string }) {
  return <span aria-hidden className={cn('block h-0.5 rounded-full bg-ink', className)} />
}

function Plus({ className }: { className: string }) {
  return (
    <span aria-hidden className={cn('relative block aspect-square', className)}>
      <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-ink" />
      <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-ink" />
    </span>
  )
}

/** Controle de quantidade inteira no estilo do Figma (botões em pílula laranja). */
export function QuantityStepper({ value, min = 1, max, onChange, itemName, size = 'lg', disabled, className }: QuantityStepperProps) {
  const style = SIZES[size]
  const button = cn(
    'grid shrink-0 place-items-center border border-ink bg-brand shadow-card transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40',
    style.button,
  )
  return (
    <div className={cn('flex items-center gap-3', className)} role="group" aria-label={`Quantidade de ${itemName}`}>
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Diminuir quantidade de ${itemName}`}
      >
        <Minus className={style.icon} />
      </button>
      <output aria-live="polite" aria-label={`Quantidade: ${value}`} className={cn('text-center tabular-nums', style.value)}>
        {value}
      </output>
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={`Aumentar quantidade de ${itemName}`}
      >
        <Plus className={style.icon} />
      </button>
    </div>
  )
}
