import { Link, Outlet, createFileRoute, redirect, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  ActivityIcon,
  CartSmallIcon,
  DangerIcon,
  DownloadIcon,
  HeartSmallIcon,
  LocationIcon,
  LoginIcon,
  UserIcon,
} from '@/components/icons'
import { Container } from '@/components/layout/container'
import { logout } from '@/features/auth/session'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_auth/conta')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/conta' || location.pathname === '/conta/') throw redirect({ to: '/conta/perfil' })
  },
  component: AccountLayout,
})

type Item =
  | {
      label: string
      icon: React.FC<React.SVGProps<SVGSVGElement>>
      to: '/conta/perfil' | '/conta/carteiras' | '/conta/favoritos'
    }
  | { label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; secao: string }

/** Itens do menu "Meu perfil". Atividade, ofertas, downloads e suporte estão fora do escopo. */
const ITEMS: Item[] = [
  { label: 'Dados do perfil', icon: UserIcon, to: '/conta/perfil' },
  { label: 'Carteiras', icon: LocationIcon, to: '/conta/carteiras' },
  { label: 'Atividade', icon: CartSmallIcon, secao: 'atividade' },
  { label: 'Lista de interesse', icon: HeartSmallIcon, to: '/conta/favoritos' },
  { label: 'Ofertas', icon: ActivityIcon, secao: 'ofertas' },
  { label: 'Arquivos baixados', icon: DownloadIcon, secao: 'downloads' },
  { label: 'Suporte', icon: DangerIcon, secao: 'suporte' },
]

function AccountLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return (
    <main className="pt-6 md:pt-8">
      <Container className="flex flex-col gap-7 lg:flex-row">
        <nav aria-label="Minha conta" className="shrink-0 bg-surface-card py-2 lg:w-[310px] lg:self-start">
          <h2 className="px-2.5 py-2.5 text-lg leading-4 font-bold">Meu perfil</h2>
          <ul className="flex overflow-x-auto lg:flex-col">
            {ITEMS.map((item) => {
              const active = 'to' in item && pathname.startsWith(item.to)
              const className = cn(
                'flex h-[45px] shrink-0 items-center gap-3 px-4 text-[15px] whitespace-nowrap text-brand-accent transition-colors hover:bg-surface-raised',
                active &&
                  'shadow-[inset_6px_0_0_var(--kurio-primary)] max-lg:shadow-[inset_0_-3px_0_var(--kurio-primary)]',
              )
              const content = (
                <>
                  <item.icon aria-hidden className="size-[18px] shrink-0" />
                  {item.label}
                </>
              )
              return (
                <li key={item.label}>
                  {'to' in item ? (
                    <Link to={item.to} aria-current={active ? 'page' : undefined} className={className}>
                      {content}
                    </Link>
                  ) : (
                    <Link to="/em-breve/$secao" params={{ secao: item.secao }} className={className}>
                      {content}
                    </Link>
                  )}
                </li>
              )
            })}
            <li className="lg:border-t lg:border-brand/40">
              <button
                type="button"
                onClick={async () => {
                  await logout(queryClient)
                  void navigate({ to: '/' })
                }}
                className="flex h-10 w-full shrink-0 items-center gap-2 px-4 text-[15px] font-bold whitespace-nowrap text-brand-accent hover:bg-surface-raised"
              >
                <LoginIcon aria-hidden className="size-5" color="var(--kurio-primary)" />
                Sair
              </button>
            </li>
          </ul>
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </Container>
    </main>
  )
}
