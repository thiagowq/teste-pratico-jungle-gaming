import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Container } from '@/components/layout/container'

// TEMPORÁRIO: substituído pela implementação na branch da funcionalidade.
export const Route = createFileRoute('/conta/carteiras')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  component: () => (
    <main className="py-24">
      <Container>
        <h1 className="text-[28px] font-bold">Carteiras</h1>
        <p className="text-text-secondary">Em implementação.</p>
      </Container>
    </main>
  ),
})
