import { useState, useSyncExternalStore } from 'react'
import Decimal from 'decimal.js'
import { FlaskConicalIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import type { EditionId } from '@/api/contracts/catalog'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { nftDetailQuery } from '@/features/catalog/queries'
import { defaultEditionId } from '@/features/nft-detail/use-purchase'
import { cn } from '@/lib/utils'

/** Descrição de cada preset dos mocks (ver src/mocks/lib/scenario.ts). */
const PRESETS: { id: string; label: string; description: string }[] = [
  { id: 'default', label: 'Padrão', description: 'Latência realista, sem falhas.' },
  { id: 'instant', label: 'Instantâneo', description: 'Respostas sem atraso.' },
  { id: 'slow', label: 'Rede lenta', description: 'Mostra skeletons e estados de carregamento.' },
  { id: 'variable-latency', label: 'Latência variável', description: 'Respostas fora de ordem.' },
  { id: 'offline', label: 'Sem conexão', description: 'Toda requisição falha por rede.' },
  { id: 'server-error', label: 'Erro do servidor', description: 'A API responde 503.' },
  { id: 'empty-catalog', label: 'Catálogo vazio', description: 'Nenhum NFT à venda.' },
  { id: 'payment-declined', label: 'Pagamento recusado', description: 'O pedido é recusado na liquidação.' },
  { id: 'wallet-rejects', label: 'Carteira recusa', description: 'A conexão da carteira é recusada.' },
  {
    id: 'order-timeout',
    label: 'Timeout no pedido',
    description: 'A primeira resposta se perde; a nova tentativa reaproveita o pedido.',
  },
]

const DEFAULT_NFT = 'emerald-ape-042'

/** NFT e edição abertos no detalhe; fora dele, um NFT de exemplo. */
function useCurrentNft() {
  return useRouterState({
    select: (state) => {
      const match = /^\/nft\/([^/]+)/.exec(state.location.pathname)
      const search = state.location.search as { edicao?: EditionId }
      return { nftId: match?.[1] ?? DEFAULT_NFT, editionId: match ? search.edicao : undefined }
    },
    structuralSharing: true,
  })
}

// O cenário vive no módulo dos mocks; o painel relê a cada alteração feita por ele.
const scenarioListeners = new Set<() => void>()
const subscribeScenario = (listener: () => void) => {
  scenarioListeners.add(listener)
  return () => {
    scenarioListeners.delete(listener)
  }
}
const notifyScenario = () => scenarioListeners.forEach((listener) => listener())

/**
 * Painel da demonstração: troca o cenário dos mocks, dispara eventos de mercado,
 * derruba o tempo real e restaura os dados. Só existe com VITE_ENABLE_MOCKS=true.
 */
export default function ScenarioPanel() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          data-mock-panel
          aria-label="Abrir painel de cenários da demonstração"
          title="Cenários da demonstração"
          className="fixed top-1/2 right-0 z-40 flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-brand/50 bg-surface-card text-brand-accent shadow-lg hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-brand"
        >
          <FlaskConicalIcon aria-hidden className="size-4" />
        </button>
      </SheetTrigger>
      <SheetContent className="w-[min(100%,380px)] gap-0 overflow-y-auto border-brand/30 bg-surface-dark sm:max-w-[380px]">
        <SheetHeader className="border-b border-brand/20 p-5">
          <SheetTitle className="text-lg">Cenários da demonstração</SheetTitle>
          <SheetDescription className="text-text-secondary">
            A API e o tempo real são simulados no navegador (MSW). O estado fica salvo neste navegador.
          </SheetDescription>
        </SheetHeader>
        {open && <PanelBody />}
      </SheetContent>
    </Sheet>
  )
}

function PanelBody() {
  return (
    <div className="flex flex-col gap-6 p-5">
      <ScenarioSection />
      <MarketSection />
      <ConnectionSection />
      <ResetSection />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`painel-${title}`}>
      <h3 id={`painel-${title}`} className="text-sm font-bold tracking-[0.08em] text-brand-accent uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function ScenarioSection() {
  const queryClient = useQueryClient()
  const current = useSyncExternalStore(subscribeScenario, () => window.__mocks!.scenario().name)

  const select = (id: string) => {
    window.__mocks!.setScenario(id)
    notifyScenario()
    // Recarrega o que está na tela já sob o novo cenário.
    void queryClient.invalidateQueries()
    toast.success(`Cenário: ${PRESETS.find((preset) => preset.id === id)?.label ?? id}`)
  }

  return (
    <Section title="Cenário">
      <div role="radiogroup" aria-label="Cenário dos mocks" className="flex flex-col gap-2">
        {PRESETS.map((preset) => {
          const selected = preset.id === current
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => select(preset.id)}
              className={cn(
                'rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand',
                selected ? 'border-brand bg-brand/15' : 'border-white/10 hover:border-brand/50',
              )}
            >
              <span className="block text-sm font-bold">{preset.label}</span>
              <span className="block text-xs leading-[18px] text-text-secondary">{preset.description}</span>
            </button>
          )
        })}
      </div>
      {current === 'custom' && <p className="text-xs text-text-secondary">Cenário personalizado (via console).</p>}
    </Section>
  )
}

function MarketSection() {
  const current = useCurrentNft()
  const nftId = current.nftId
  const nft = useQuery(nftDetailQuery(nftId))
  const [chosen, setEditionId] = useState<EditionId | null>(null)
  // Sem escolha no painel, segue a edição exibida no detalhe.
  const editionId = chosen ?? current.editionId ?? (nft.data ? defaultEditionId(nft.data) : undefined)
  const edition = nft.data?.editions.find((candidate) => candidate.id === editionId) ?? nft.data?.editions[0]

  const apply = (patch: { priceEth?: string; available?: number }, message: string) => {
    if (!edition) return
    window.__mocks!.updateEdition(nftId, edition.id, patch)
    toast.info(message)
  }
  const changePrice = (factor: number) => {
    if (!edition) return
    const next = new Decimal(edition.priceEth).mul(factor).toDecimalPlaces(3).toString()
    apply({ priceEth: next }, `Evento nft.updated: preço da edição ${edition.label} → ${next} ETH`)
  }

  return (
    <Section title="Mercado em tempo real">
      <p className="text-xs leading-[18px] text-text-secondary">
        Altera a API e emite <code>nft.updated</code> pelo Socket.IO. Abra o detalhe, o carrinho ou o pagamento para ver
        a reconciliação.
      </p>
      {nft.isPending && <p className="text-sm text-text-secondary">Carregando NFT…</p>}
      {nft.data && edition && (
        <>
          <p className="text-sm">
            <span className="font-bold">{nft.data.name}</span>
            <span className="text-text-secondary">
              {' '}
              · {edition.priceEth} ETH · {edition.available} disponíveis
            </span>
          </p>
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            Edição
            <select
              value={edition.id}
              onChange={(event) => setEditionId(event.target.value as EditionId)}
              className="h-9 rounded-md border border-white/15 bg-surface-card px-2 text-sm text-foreground"
            >
              {nft.data.editions.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => changePrice(1.1)}>
              Preço +10%
            </Button>
            <Button variant="outline" size="sm" onClick={() => changePrice(0.9)}>
              Preço −10%
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={edition.available === 0}
              onClick={() => apply({ available: 0 }, `Evento nft.updated: edição ${edition.label} esgotada`)}
            >
              Esgotar edição
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => apply({ available: edition.available + 5 }, `Evento nft.updated: +5 unidades`)}
            >
              Repor 5 unidades
            </Button>
          </div>
        </>
      )}
    </Section>
  )
}

function ConnectionSection() {
  return (
    <Section title="Conexão e sessão">
      <div className="grid grid-cols-1 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.__mocks!.socketOutage(5_000)
            toast.info('Tempo real fora do ar por 5 s; eventos do período são recuperados via REST.')
          }}
        >
          Derrubar tempo real por 5 s
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.__mocks!.expireSessions()
            toast.info('Sessões expiradas: a próxima requisição autenticada leva ao login.')
          }}
        >
          Expirar sessão
        </Button>
      </div>
    </Section>
  )
}

function ResetSection() {
  return (
    <Section title="Dados">
      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          // Sessão, carrinho do visitante e rascunhos da aplicação também voltam ao início.
          localStorage.clear()
          sessionStorage.clear()
          window.__mocks!.reset()
          window.location.assign('/')
        }}
      >
        Restaurar dados iniciais
      </Button>
      <p className="text-xs leading-[18px] text-text-secondary">
        Volta catálogo, contas, carrinhos e pedidos ao estado original e reinicia a sessão.
      </p>
    </Section>
  )
}
