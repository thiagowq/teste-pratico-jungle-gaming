import { cn } from '@/lib/utils'

/** Largura útil do layout desktop (1200px) com respiro lateral em telas menores. */
export function Container({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-page px-4 md:px-6 xl:px-0', className)} {...props} />
}
