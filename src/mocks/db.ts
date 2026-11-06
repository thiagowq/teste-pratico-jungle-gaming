import { buildNftFixtures, type NftRecord } from './fixtures/nfts'
import { buildUserFixtures, type UserRecord } from './fixtures/users'
import { createPersistentState } from './lib/persist'

export interface SessionRecord {
  userId: string
  expiresAt: string
}

/**
 * Estado único e consistente da API simulada. Persistido em localStorage para
 * sobreviver a refresh; `reset()` restaura integralmente as fixtures.
 * A chave tem versão: mudar o formato exige incrementá-la.
 */
export interface MockDatabase {
  users: Record<string, UserRecord>
  sessions: Record<string, SessionRecord>
  nfts: Record<string, NftRecord>
  /** Ordem original do catálogo (desempate estável na ordenação). */
  nftOrder: string[]
  favorites: Record<string, string[]>
}

function seed(): MockDatabase {
  const nfts = buildNftFixtures()
  return {
    users: Object.fromEntries(buildUserFixtures().map((user) => [user.id, user])),
    sessions: {},
    nfts: Object.fromEntries(nfts.map((nft) => [nft.id, nft])),
    nftOrder: nfts.map((nft) => nft.id),
    favorites: { 'user-ana': ['sage-nomad-009'] },
  }
}

export const db = createPersistentState<MockDatabase>('db:v1', seed)
