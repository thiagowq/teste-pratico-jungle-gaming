import { createFileRoute } from '@tanstack/react-router'
import { Container } from '@/components/layout/container'

// TEMPORÁRIO: substituído pela tela de pagamento na branch da funcionalidade.
export const Route = createFileRoute('/_auth/pagamento')({
  component: () => (
    <main className="py-24">
      <Container>
        <h1 className="text-[28px] font-bold">Pagamento</h1>
        <p className="text-text-secondary">Em implementação.</p>
      </Container>
    </main>
  ),
})
