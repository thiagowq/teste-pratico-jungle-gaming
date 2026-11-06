import type { EditionId } from '@/api/contracts/catalog'
import type { RealtimeEvent } from '@/realtime/events'
import { db } from './db'
import { publish } from './lib/event-bus'
import { publishNftUpdated } from './lib/events'
import { resetAllPersistentState } from './lib/persist'
import { reseedLatency } from './lib/respond'
import { getScenario, setFault, setScenario, updateScenario, SCENARIO_PRESETS, type FaultRule } from './lib/scenario'
import { dropSocketConnections } from './handlers/realtime'

/**
 * API de controle dos mocks exposta em `window.__mocks`. Usada pelos testes
 * Playwright e pelo painel de cenários; nunca pela aplicação.
 */
export const mockControl = {
  presets: Object.keys(SCENARIO_PRESETS),
  scenario: () => getScenario(),
  setScenario: (name: string) => {
    setScenario(name)
    reseedLatency()
  },
  updateScenario,
  setFault: (route: string, rule: FaultRule | null) => setFault(route, rule),
  /** Restaura dados e cenário a um estado conhecido. */
  reset: () => {
    resetAllPersistentState()
    setScenario('default')
    reseedLatency()
  },
  emit: (event: RealtimeEvent, userId: string | null = null) => publish({ event, userId }),
  /**
   * Altera preço e/ou disponibilidade de uma edição como se o mercado mudasse:
   * atualiza a API REST, incrementa a versão do NFT e emite `nft.updated`.
   */
  updateEdition: (nftId: string, editionId: EditionId, patch: { priceEth?: string; available?: number }) => {
    const next = db.update((draft) => {
      const nft = draft.nfts[nftId]
      const edition = nft?.editions.find((candidate) => candidate.id === editionId)
      if (!nft || !edition) throw new Error(`Edição inexistente: ${nftId}/${editionId}`)
      if (patch.priceEth !== undefined) {
        edition.previousPriceEth = edition.priceEth
        edition.priceEth = patch.priceEth
      }
      if (patch.available !== undefined) edition.available = patch.available
      nft.version += 1
    })
    return publishNftUpdated(next.nfts[nftId])
  },
  /** Expira todas as sessões ativas (simula expiração durante a navegação). */
  expireSessions: () =>
    db.update((draft) => {
      const past = new Date(Date.now() - 1000).toISOString()
      Object.values(draft.sessions).forEach((session) => {
        session.expiresAt = past
      })
    }),
  dropSockets: () => dropSocketConnections(),
}

export type MockControl = typeof mockControl

declare global {
  interface Window {
    __mocks?: MockControl
  }
}

export function installMockControl() {
  window.__mocks = mockControl
}
