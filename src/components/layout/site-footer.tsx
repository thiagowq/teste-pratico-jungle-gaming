import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  SocialFacebookIcon,
  SocialInstagramIcon,
  SocialLinkedinIcon,
  SocialTwitterIcon,
  SocialYoutubeIcon,
} from '@/components/icons'
import { CATEGORY_LABELS, type Category } from '@/api/contracts/catalog'
import { cn } from '@/lib/utils'
import { Container } from './container'

const FEATURES = [
  { mark: 'W', title: 'Segurança da carteira', text: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { mark: 'C', title: 'Criadores em destaque', text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { mark: 'D', title: 'Alertas de lançamentos', text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

const PROFILE_LINKS: Array<{ label: string; to?: '/conta/perfil' | '/conta/favoritos'; secao?: string }> = [
  { label: 'Meu perfil', to: '/conta/perfil' },
  { label: 'Minha coleção', secao: 'colecao' },
  { label: 'Atividade', secao: 'atividade' },
  { label: 'Estúdio do criador', secao: 'estudio' },
  { label: 'Lista de interesse', to: '/conta/favoritos' },
]

const HELP_LINKS = [
  { label: 'Central de ajuda', slug: 'ajuda' },
  { label: 'Como comprar NFTs', slug: 'como-comprar' },
  { label: 'Carteira e segurança', slug: 'seguranca' },
  { label: 'Política do mercado', slug: 'politica' },
  { label: 'Denunciar item', slug: 'denunciar' },
]

const FOOTER_CATEGORIES: Category[] = ['arte-digital', 'fotografia', 'musica', 'arte-3d', 'utilidade']

const SOCIALS = [
  { label: 'Facebook', icon: SocialFacebookIcon, href: 'https://www.facebook.com' },
  { label: 'Instagram', icon: SocialInstagramIcon, href: 'https://www.instagram.com' },
  { label: 'X (Twitter)', icon: SocialTwitterIcon, href: 'https://x.com' },
  { label: 'LinkedIn', icon: SocialLinkedinIcon, href: 'https://www.linkedin.com' },
  { label: 'YouTube', icon: SocialYoutubeIcon, href: 'https://www.youtube.com' },
]

function Newsletter() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          setError('Informe um e-mail válido.')
          return
        }
        setError(null)
        // Fora do escopo do desafio: não simulamos sucesso de uma inscrição inexistente.
        toast.info('A newsletter ainda não está disponível nesta demonstração. Nenhum e-mail foi cadastrado.')
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        E-mail para a newsletter
      </label>
      <div className="flex h-10 overflow-hidden rounded-md bg-surface-dark shadow-overlay">
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="digite seu e-mail..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'newsletter-error' : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-tan focus:outline-none"
        />
        <button type="submit" className="bg-brand px-4 text-lg font-bold text-ink hover:brightness-110">
          Enviar
        </button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="mt-2 text-sm text-coral">
          {error}
        </p>
      )}
    </form>
  )
}

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('mt-16 pb-[120px] md:mt-24 md:pb-6', className)}>
      <Container>
        <section aria-label="Destaques da Kurio" className="bg-surface-card p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_1.35fr] lg:gap-0">
            {FEATURES.map((feature) => (
              <div key={feature.mark} className="flex flex-col gap-3 lg:border-r lg:border-brand lg:px-4">
                <span aria-hidden className="grid size-[74px] place-items-center rounded-full bg-brand text-2xl font-bold text-ink">
                  {feature.mark}
                </span>
                <h2 className="text-[17px] leading-4 font-bold">{feature.title}</h2>
                <p className="max-w-[204px] text-sm leading-[22px] text-text-secondary">{feature.text}</p>
              </div>
            ))}
            <div className="flex flex-col gap-4 lg:px-4">
              <h2 className="text-lg leading-4 font-bold">Antecipe-se ao próximo lançamento</h2>
              <Newsletter />
              <p className="text-[13px] leading-[22px] text-text-secondary">
                Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-3 bg-surface-dark px-8 py-6 text-sm leading-[22px] md:grid-cols-4 md:items-center md:gap-6">
          <span className="text-sm font-bold tracking-[0.1em]">KURIO</span>
          <p>
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
          <a href="mailto:contato@email.com" className="hover:text-brand-accent">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="hover:text-brand-accent">
            +55 11 4002 8922
          </a>
        </div>

        <div className="grid gap-8 bg-surface-card p-8 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-labelledby="footer-profile">
            <h2 id="footer-profile" className="mb-2 text-lg leading-4 font-bold">
              Meu perfil
            </h2>
            <ul className="text-sm leading-[30px]">
              {PROFILE_LINKS.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link to={link.to} className="hover:text-brand-accent">
                      {link.label}
                    </Link>
                  ) : (
                    <Link to="/em-breve/$secao" params={{ secao: link.secao! }} className="hover:text-brand-accent">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-help">
            <h2 id="footer-help" className="mb-2 text-lg leading-4 font-bold">
              Central de ajuda
            </h2>
            <ul className="text-sm leading-[30px]">
              {HELP_LINKS.map((link) => (
                <li key={link.slug}>
                  <Link to="/em-breve/$secao" params={{ secao: link.slug }} className="hover:text-brand-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-collections">
            <h2 id="footer-collections" className="mb-2 text-lg leading-4 font-bold">
              Coleções
            </h2>
            <ul className="text-sm leading-[30px]">
              {FOOTER_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link to="/" search={{ categories: [category] }} hash="mercado" className="hover:text-brand-accent">
                    {CATEGORY_LABELS[category]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="mb-5 text-lg leading-4 font-bold">Redes sociais</h2>
              <ul className="flex gap-2.5">
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social.label} (abre em nova aba)`}
                      className="block rounded-sm hover:brightness-125"
                    >
                      <social.icon aria-hidden className="size-[30px]" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-lg leading-4 font-bold">Carteiras compatíveis</h2>
              <p className="inline-flex h-[26px] items-center rounded-md border border-border-soft bg-surface-dark px-2 text-[9px] leading-3 font-bold tracking-[0.01em] text-brand-accent">
                METAMASK&nbsp; •&nbsp; WALLETCONNECT&nbsp; •&nbsp; COINBASE
              </p>
            </div>
          </div>
        </div>
        <p className="mt-1.5 text-center text-sm leading-[30px]">© 2026 Kurio. Propriedade digital para todos.</p>
      </Container>
    </footer>
  )
}
