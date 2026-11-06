import type { RealtimeEvent } from '@/realtime/events'
import { publish } from './lib/event-bus'
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
