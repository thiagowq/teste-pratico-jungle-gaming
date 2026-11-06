import { Link } from '@tanstack/react-router'
import { NftImage, type NftArtwork } from '@/components/nft-image'

const POSTS: Array<{ date: string; minutes: number; title: string; text: string; artwork: NftArtwork }> = [
  { date: '12 de setembro', minutes: 6, title: 'Como funciona a propriedade de NFTs', text: 'Aprenda a colecionar, negociar e verificar ativos digitais.', artwork: 'ape-baron' },
  { date: '13 de setembro', minutes: 2, title: '10 artistas digitais para acompanhar', text: 'Conheça criadores que moldam a cultura digital.', artwork: 'ape-emerald' },
  { date: '15 de setembro', minutes: 3, title: 'Raridade, atributos e procedência', text: 'Entenda raridade, procedência, direitos autorais e utilidade.', artwork: 'gorilla-nomad' },
  { date: '15 de setembro', minutes: 2, title: 'Como proteger sua carteira', text: 'Proteja sua carteira, seus ativos e sua identidade.', artwork: 'ape-golden' },
]

/** "Diário da Cunhagem": conteúdo editorial fora do escopo; os links levam à página "em breve". */
export function Blog() {
  return (
    <section aria-labelledby="blog-heading" className="flex flex-col items-center gap-10">
      <header className="flex flex-col gap-3 text-center">
        <h2 id="blog-heading" className="text-[28px] leading-[37px] font-bold">
          Diário da Cunhagem
        </h2>
        <p className="text-sm leading-[18px] text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="relative flex h-full flex-col overflow-hidden rounded-lg bg-surface-card">
              <div className="h-[195px] overflow-hidden">
                <NftImage artwork={post.artwork} alt="" sizes="(min-width: 1024px) 268px, (min-width: 640px) 50vw, 100vw" className="size-full object-[50%_30%]" />
              </div>
              <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                <p className="text-xs leading-4 font-medium text-text-secondary">
                  {post.date}&nbsp; | &nbsp;Leitura de {post.minutes} min
                </p>
                <h3 className="text-base leading-[21px] font-bold">{post.title}</h3>
                <p className="text-xs leading-4 font-medium text-text-secondary">{post.text}</p>
                <Link
                  to="/em-breve/$secao"
                  params={{ secao: 'diario' }}
                  className="mt-auto flex gap-1 text-xs leading-4 font-bold text-brand-accent after:absolute after:inset-0 hover:underline"
                >
                  Ler mais <span aria-hidden>→</span>
                  <span className="sr-only">: {post.title}</span>
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
