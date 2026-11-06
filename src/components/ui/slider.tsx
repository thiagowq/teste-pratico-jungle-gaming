import * as React from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/**
 * Slider shadcn/ui no estilo do filtro de preço do Figma: trilho de 4px em
 * Color/Primary e alças de 15px com borda Color/Ink. `thumbLabels` dá um nome
 * acessível a cada alça (ex.: "Preço mínimo" e "Preço máximo").
 */
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { thumbLabels?: string[] }) {
  const values = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex h-[21px] w-full touch-none items-center select-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1 grow overflow-hidden rounded-full bg-brand/40"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-brand" />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={thumbLabels?.[index]}
          className="block size-[15px] shrink-0 rounded-full border-[3px] border-ink bg-brand outline-offset-2 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand-accent"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
