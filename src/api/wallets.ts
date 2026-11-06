import { api } from './client'
import { walletConnection, walletsResponse, type WalletInput, type WalletSlot } from './contracts/wallets'
import type { Network } from './contracts/common'
import type { WalletType } from './contracts/wallets'
import { parseResponse } from './parse'

export async function fetchWallets(signal?: AbortSignal) {
  const { data } = await api.get('/wallets', { signal })
  return parseResponse(walletsResponse, data)
}

export async function saveWallet(slot: WalletSlot, body: WalletInput) {
  const { data } = await api.put(`/wallets/${slot}`, body)
  return parseResponse(walletsResponse, data)
}

export async function removeWallet(slot: WalletSlot) {
  const { data } = await api.delete(`/wallets/${slot}`)
  return parseResponse(walletsResponse, data)
}

/** Conexão simulada com o provedor da carteira (pode ser recusada pelo "usuário" no cenário). */
export async function connectWallet(body: { provider: WalletType; network: Network; address: string }) {
  const { data } = await api.post('/wallets/connect', body)
  return parseResponse(walletConnection, data)
}

export async function disconnectWallet(connectionId: string) {
  await api.post('/wallets/disconnect', { connectionId })
}
