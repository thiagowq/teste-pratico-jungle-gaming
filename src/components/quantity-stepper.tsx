import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  /** Nome do item, para rótulos acessíveis ("Diminuir quantidade de Emerald Ape #042"). */
  itemName: string
  size?: keyof typeof SIZES
  disabled?: boolean
  className?: string
}

const PILL = 'border border-ink bg-brand text-ink shadow-card hover:brightness-110'
const ROUND = 'rounded-full border border-border bg-surface-raised text-foreground hover:border-brand'

const SIZES = {
  // Detalhe desktop: botões 33×50, número 20/28.
  lg: {
    button: cn(PILL, 'h-[50px] w-[33px] rounded-[33px]'),
    icon: 'w-[15px]',
    value: 'min-w-[13px] text-xl leading-7',
  },
  // Detalhe mobile: botões 20×30, número 18/25.
  md: {
    button: cn(PILL, 'h-[30px] w-5 rounded-[20px]'),
    icon: 'w-2.5',
    value: 'min-w-[11px] text-lg leading-[25px] font-medium',
  },
  // Carrinho desktop: botões 20×30, número 17/24.
  sm: { button: cn(PILL, 'h-[30px] w-5 rounded-[20px]'), icon: 'w-2.5', value: 'min-w-[11px] text-[17px] leading-6' },
  // Carrinho mobile: botões redondos escuros de 24px, número 16/22.
  round: { button: cn(ROUND, 'size-6'), icon: 'w-[9px]', value: 'min-w-[10px] text-base leading-[22px]' },
} as const

function Minus({ className }: { className: string }) {
  return <span aria-hidden className={cn('block h-0.5 rounded-full bg-current', className)} />
}

function Plus({ className }: { className: string }) {
  return (
    <span aria-hidden className={cn('relative block aspect-square', className)}>
      <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-current" />
      <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-current" />
    </span>
  )
}

/** Controle de quantidade inteira nos estilos do Figma (pílula laranja ou botão redondo escuro). */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  itemName,
  size = 'lg',
  disabled,
  className,
}: QuantityStepperProps) {
  const style = SIZES[size]
  const button = cn(
    'grid shrink-0 place-items-center transition-[filter,opacity,border-color] disabled:cursor-not-allowed disabled:opacity-40',
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
      <output
        aria-live="polite"
        aria-label={`Quantidade: ${value}`}
        className={cn('text-center tabular-nums', style.value)}
      >
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
