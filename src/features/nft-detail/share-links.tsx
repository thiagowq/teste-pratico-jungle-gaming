import { MessageIcon, ShareLinkedinIcon, ShareTwitterIcon } from '@/components/icons'

/** Compartilhamento por links públicos de cada rede (abrem em nova aba) e e-mail. */
export function ShareLinks({ name }: { name: string }) {
  const url = typeof window === 'undefined' ? '' : window.location.href
  const text = `${name} na Kurio`
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <ShareLinkedinIcon aria-hidden />,
      external: true,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      icon: <MessageIcon aria-hidden />,
      external: false,
    },
    {
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: <ShareTwitterIcon aria-hidden />,
      external: true,
    },
  ]
  return (
    <div className="flex items-center gap-2">
      <span className="text-[15px] leading-4 font-bold">Compartilhar este NFT:</span>
      <ul className="flex items-center gap-1">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              aria-label={`Compartilhar por ${link.label}${link.external ? ' (abre em nova aba)' : ''}`}
              className="grid size-7 place-items-center rounded-sm hover:bg-surface-raised"
            >
              {link.icon}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
