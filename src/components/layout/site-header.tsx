import { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { CartIcon, LoginIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { logout, useSession } from '@/features/auth/session'
import { cn } from '@/lib/utils'
import { Container } from './container'

type NavKey = 'home' | 'market' | 'creators' | 'learn'

/** Seção ativa do menu: o detalhe, carrinho e checkout pertencem ao "Mercado". */
function useActiveNav(): NavKey | null {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (pathname === '/') return 'home'
  if (/^\/(nft|carrinho|pagamento|pedido)/.test(pathname)) return 'market'
  if (pathname.startsWith('/em-breve/criadores')) return 'creators'
  if (pathname.startsWith('/em-breve/aprenda')) return 'learn'
  return null
}

const NAV_ITEMS: Array<{ key: NavKey; label: string; hash?: string; secao?: string }> = [
  { key: 'home', label: 'Início' },
  { key: 'market', label: 'Mercado', hash: 'mercado' },
  { key: 'creators', label: 'Criadores', secao: 'criadores' },
  { key: 'learn', label: 'Aprenda', secao: 'aprenda' },
]

export function SiteHeader({ cartCount = 0, divider = false }: { cartCount?: number; divider?: boolean }) {
  const active = useActiveNav()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="hidden pt-6 md:block">
      <Container>
        <div className={cn('flex h-[45px] items-start justify-between gap-6', divider && 'border-b border-brand/40')}>
          <Link to="/" className="mt-2 w-40 text-sm leading-[18px] font-bold tracking-[0.1em]" aria-label="Kurio, página inicial">
            KURIO
          </Link>

          <nav aria-label="Principal" className="flex h-full gap-6 lg:gap-10">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.key
              return (
                <Link
                  key={item.key}
                  to={item.secao ? '/em-breve/$secao' : '/'}
                  params={item.secao ? { secao: item.secao } : undefined}
                  hash={item.hash}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative h-full text-base leading-[21px] whitespace-nowrap transition-colors hover:text-brand-accent',
                    isActive
                      ? 'font-bold text-brand-accent after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-brand'
                      : 'text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-5 lg:gap-7">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid size-9 place-items-center rounded-md hover:bg-surface-raised"
              aria-label="Buscar NFTs"
            >
              <SearchIcon aria-hidden />
            </button>
            <Link
              to="/carrinho"
              className="relative grid h-9 w-10 place-items-center rounded-md hover:bg-surface-raised"
              aria-label={cartCount > 0 ? `Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}` : 'Carrinho vazio'}
            >
              <CartIcon aria-hidden />
              {cartCount > 0 && (
                <span
                  aria-hidden
                  className="absolute top-0 right-0 grid size-4 place-items-center rounded-full bg-brand text-[10px] leading-[13px] font-medium text-ink outline-2 outline-ink"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            <AccountButton />
          </div>
        </div>
      </Container>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}

function AccountButton() {
  const { user, isPending } = useSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.href })

  if (isPending) return <div className="skeleton h-[35px] w-[100px]" aria-hidden />

  if (!user) {
    return (
      <Button asChild className="h-[35px] w-[100px] gap-1 rounded-md px-0 text-base font-medium">
        <Link to="/entrar" search={{ redirect: pathname === '/entrar' ? undefined : pathname }}>
          <LoginIcon aria-hidden />
          Entrar
        </Link>
      </Button>
    )
  }

  const initials = user.displayName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-[35px] items-center gap-2 rounded-md border border-brand px-2 text-sm font-medium text-brand-accent hover:bg-brand/10"
        aria-label={`Conta de ${user.displayName}`}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-6 rounded-full object-cover" />
        ) : (
          <span aria-hidden className="grid size-6 place-items-center rounded-full bg-brand text-[10px] font-bold text-ink">
            {initials}
          </span>
        )}
        <span className="max-w-24 truncate">{user.displayName.split(' ')[0]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/conta/perfil">Meu perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/conta/carteiras">Carteiras</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await logout(queryClient)
            void navigate({ to: '/' })
          }}
        >
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-24 translate-y-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar NFTs</DialogTitle>
          <DialogDescription>Procure por nome, coleção ou criador.</DialogDescription>
        </DialogHeader>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            const q = value.trim()
            onOpenChange(false)
            void navigate({ to: '/', search: { q: q || undefined }, hash: 'mercado' })
          }}
          className="flex gap-2"
        >
          <label htmlFor="global-search" className="sr-only">
            Termo de busca
          </label>
          <Input
            id="global-search"
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Ex.: Emerald Ape"
            autoComplete="off"
            maxLength={80}
          />
          <Button type="submit">Buscar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
