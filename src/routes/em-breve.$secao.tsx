import { Link, createFileRoute } from '@tanstack/react-router'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

/** Seções fora do escopo do desafio (páginas editoriais, suporte, atividade...). */
const SECTIONS: Record<string, string> = {
  criadores: 'Criadores',
  aprenda: 'Aprenda',
  colecao: 'Minha coleção',
  atividade: 'Atividade',
  estudio: 'Estúdio do criador',
  ofertas: 'Ofertas',
  downloads: 'Arquivos baixados',
  suporte: 'Suporte',
  ajuda: 'Central de ajuda',
  'como-comprar': 'Como comprar NFTs',
  seguranca: 'Carteira e segurança',
  politica: 'Política do mercado',
  denunciar: 'Denunciar item',
  diario: 'Diário da Cunhagem',
}

export const Route = createFileRoute('/em-breve/$secao')({
  head: () => ({ meta: [{ title: 'Em breve | Kurio' }] }),
  component: ComingSoon,
})

function ComingSoon() {
  const { secao } = Route.useParams()
  const title = SECTIONS[secao] ?? 'Esta seção'
  return (
    <main className="py-24">
      <Container className="flex flex-col items-start gap-4">
        <p className="text-sm font-bold tracking-[0.1em] text-brand-accent">EM BREVE</p>
        <h1 className="text-[28px] leading-[37px] font-bold">{title}</h1>
        <p className="max-w-prose text-text-secondary">
          Esta área ainda não está disponível nesta versão do marketplace. Nenhuma ação foi realizada.
        </p>
        <Button asChild>
          <Link to="/">Explorar NFTs</Link>
        </Button>
      </Container>
    </main>
  )
}
