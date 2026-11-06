import { useNavigate, useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'
import { CardHeartIcon } from '@/components/icons'
import type { ApiError } from '@/api/errors'
import { cn } from '@/lib/utils'
import { useFavorites, useToggleFavorite } from './use-favorites'

interface FavoriteButtonProps {
  nftId: string
  nftName: string
  className?: string
  /** `icon`: botão quadrado (card e mobile). `full`: botão com texto ("Favoritar"). */
  variant?: 'icon' | 'full' | 'round'
}

/**
 * Favoritar com atualização otimista. Visitantes são levados ao login e
 * retornam à mesma página. O estado não depende só de cor: o rótulo e o
 * `aria-pressed` mudam junto.
 */
export function FavoriteButton({ nftId, nftName, className, variant = 'icon' }: FavoriteButtonProps) {
  const { isFavorite, isAuthenticated } = useFavorites()
  const toggle = useToggleFavorite()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })
  const active = isFavorite(nftId)
  const label = active ? `Remover ${nftName} dos favoritos` : `Favoritar ${nftName}`

  const onClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isAuthenticated) {
      toast.info('Entre na sua conta para salvar favoritos.')
      void navigate({ to: '/entrar', search: { redirect: href } })
      return
    }
    toggle.mutate(
      { nftId, favorite: !active },
      {
        onSuccess: () => toast.success(active ? 'Removido dos favoritos.' : 'Adicionado aos favoritos.'),
        onError: (error) => {
          const apiError = error as ApiError
          if (!apiError.isAuthError) toast.error(`Não foi possível atualizar o favorito. ${apiError.message}`)
        },
      },
    )
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={label}
        className={cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-brand px-4 text-sm font-medium transition-colors',
          active ? 'bg-brand text-ink' : 'text-brand-accent hover:bg-brand/10',
          className,
        )}
      >
        <CardHeartIcon aria-hidden color="currentColor" />
        {active ? 'Favoritado' : 'Favoritar'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'grid place-items-center border transition-colors',
        variant === 'round' ? 'size-7 rounded-full' : 'size-[35px] rounded-sm',
        active
          ? 'border-brand bg-brand text-ink'
          : 'border-border bg-surface-raised text-brand hover:border-brand',
        className,
      )}
    >
      <CardHeartIcon aria-hidden color="currentColor" className={variant === 'round' ? 'size-4' : 'size-5'} />
    </button>
  )
}
