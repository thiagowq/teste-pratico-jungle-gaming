import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

/**
 * Botão shadcn/ui adaptado ao Figma: preenchimento Color/Primary com texto
 * Color/Ink em negrito, contorno laranja para ações secundárias e versão
 * "pill" com gradiente usada nas telas mobile.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-bold whitespace-nowrap transition-[color,background-color,border-color,opacity,filter] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:brightness-110 active:brightness-95',
        outline: 'border border-primary bg-transparent font-medium text-brand-accent hover:bg-primary/10',
        ghost: 'bg-transparent font-medium text-brand-accent hover:bg-surface-raised',
        link: 'h-auto bg-transparent p-0 font-medium text-brand-accent underline-offset-4 hover:underline',
        destructive: 'bg-error text-foreground hover:brightness-110',
        pill: 'rounded-[40px] bg-linear-to-r from-[#d28a4c] via-[#c98247] to-[#a8693a] text-primary-foreground shadow-card hover:brightness-110',
      },
      size: {
        default: 'h-10 rounded-md px-6 text-sm',
        sm: 'h-9 rounded-md px-3 text-base',
        lg: 'h-12 rounded-[5px] px-4 text-base',
        block: 'h-10 w-full rounded-sm px-6 text-[15px]',
        pill: 'h-15 w-full px-6 text-base',
        icon: 'size-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
