import { resourceKey, type RealtimeEvent } from './events'

const MAX_REMEMBERED_IDS = 500

/**
 * Filtra eventos já aplicados (mesmo `id`) ou obsoletos (versão menor ou igual
 * à última conhecida do recurso). Versões vindas de respostas REST também são
 * registradas via `observe`, para que um evento atrasado não regrida o estado.
 */
export class EventGate {
  private readonly seenIds = new Set<string>()
  private readonly versions = new Map<string, number>()

  accept(event: RealtimeEvent): boolean {
    if (this.seenIds.has(event.id)) return false
    this.remember(event.id)
    const key = resourceKey(event.resource)
    const known = this.versions.get(key)
    if (known !== undefined && event.version <= known) return false
    this.versions.set(key, event.version)
    return true
  }

  observe(resource: { type: string; id: string }, version: number) {
    const key = resourceKey(resource)
    const known = this.versions.get(key)
    if (known === undefined || version > known) this.versions.set(key, version)
  }

  reset() {
    this.seenIds.clear()
    this.versions.clear()
  }

  private remember(id: string) {
    this.seenIds.add(id)
    if (this.seenIds.size > MAX_REMEMBERED_IDS) {
      const oldest = this.seenIds.values().next().value
      if (oldest !== undefined) this.seenIds.delete(oldest)
    }
  }
}
