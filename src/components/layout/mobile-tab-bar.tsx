import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { HomeIcon, ScanIcon, ShopIcon, TabHeartIcon, UserBoldIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { SearchDialog } from './site-header'

/** Recorte central da barra (path do Figma, transladado para a origem). */
function Notch() {
  return (
    <svg width="152" height="95" viewBox="0 0 152 95" aria-hidden className="shrink-0" preserveAspectRatio="none">
      <path
        d="M151.7 0C137.94 0 125.72 8.2 119.87 20.65C112.11 37.17 95.31 48.62 75.85 48.62C56.39 48.62 39.59 37.18 31.83 20.65C25.98 8.2 13.75 0 0 0V95H151.7V0Z"
        fill="var(--kurio-surface-card)"
      />
    </svg>
  )
}

const ITEMS = [
  { to: '/', label: 'Início', icon: HomeIcon, match: (path: string) => path === '/' },
  {
    to: '/conta/favoritos',
    label: 'Favoritos',
    icon: TabHeartIcon,
    match: (path: string) => path.startsWith('/conta/favoritos'),
  },
  null,
  { to: '/carrinho', label: 'Carrinho', icon: ShopIcon, match: (path: string) => path.startsWith('/carrinho') },
  {
    to: '/conta/perfil',
    label: 'Conta',
    icon: UserBoldIcon,
    match: (path: string) => /^\/conta\/(perfil|carteiras)/.test(path),
  },
] as const

/** Barra inferior das telas mobile (< 768px), com o botão central de busca. */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{ filter: 'drop-shadow(0 -10px 15px rgb(10 6 4 / 45%))' }}
      >
        <div className="relative flex h-[95px] items-stretch pb-[env(safe-area-inset-bottom)]">
          <div aria-hidden className="absolute inset-0 flex">
            <div className="-mr-px flex-1 rounded-tl-[29px] bg-surface-card" />
            <Notch />
            <div className="-ml-px flex-1 rounded-tr-[29px] bg-surface-card" />
          </div>
          <ul className="relative grid w-full grid-cols-5 items-start pt-[31px]">
            {ITEMS.map((item, index) =>
              item === null ? (
                <li key="search" className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="-mt-[62px] grid size-[65px] place-items-center rounded-full bg-linear-to-b from-[#d28a4c66] to-brand shadow-card"
                    aria-label="Buscar NFTs"
                  >
                    <ScanIcon aria-hidden />
                  </button>
                </li>
              ) : (
                <li key={index} className="flex justify-center">
                  <Link
                    to={item.to}
                    aria-label={item.label}
                    aria-current={item.match(pathname) ? 'page' : undefined}
                    className={cn(
                      'grid size-11 place-items-center rounded-full',
                      item.match(pathname) ? 'text-brand-accent' : 'text-text-secondary',
                    )}
                  >
                    <item.icon aria-hidden className="size-5" color="currentColor" />
                  </Link>
                </li>
              ),
            )}
          </ul>
        </div>
      </nav>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
