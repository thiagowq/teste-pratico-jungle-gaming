import { cn } from './utils'

const inputBase =
  'w-full rounded-[5px] border border-border bg-transparent px-4 text-sm text-foreground placeholder:text-tan transition-colors focus:border-brand focus:outline-none aria-invalid:border-coral disabled:opacity-50'

/** Classe dos campos de texto do Figma: 40px (desktop) ou 50px com raio 10 (mobile/"lg"). */
export const inputClass = (size: 'md' | 'lg' = 'md') =>
  cn(inputBase, size === 'lg' ? 'h-[50px] rounded-[10px]' : 'h-10')
