/**
 * Estado dos mocks persistido em localStorage, para que refresh preserve
 * catálogo, carrinho, pedidos etc. `reset()` restaura a semente inteira.
 */
export interface PersistentState<T> {
  get(): T
  update(mutator: (draft: T) => void): T
  reset(): void
}

const registry = new Set<PersistentState<unknown>>()

export function createPersistentState<T>(key: string, seed: () => T): PersistentState<T> {
  const storageKey = `nft-mock:${key}`
  let cache: T | undefined

  const load = (): T => {
    if (cache !== undefined) return cache
    try {
      const raw = localStorage.getItem(storageKey)
      cache = raw ? (JSON.parse(raw) as T) : seed()
    } catch {
      cache = seed()
    }
    return cache
  }

  const save = (value: T) => {
    cache = value
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Sem armazenamento: o estado vive só em memória.
    }
  }

  const state: PersistentState<T> = {
    get: load,
    update(mutator) {
      const draft = structuredClone(load())
      mutator(draft)
      save(draft)
      return draft
    },
    reset() {
      save(seed())
    },
  }
  registry.add(state as PersistentState<unknown>)
  return state
}

export function resetAllPersistentState() {
  registry.forEach((state) => state.reset())
}
