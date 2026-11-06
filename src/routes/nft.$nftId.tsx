import { createFileRoute } from '@tanstack/react-router'
import { Container } from '@/components/layout/container'

// TEMPORÁRIO: substituído pela tela de detalhe na branch da funcionalidade.
export const Route = createFileRoute('/nft/$nftId')({
  component: () => (
    <main className="py-24">
      <Container>
        <h1 className="text-[28px] font-bold">Detalhes do NFT</h1>
        <p className="text-text-secondary">Em implementação.</p>
      </Container>
    </main>
  ),
})
