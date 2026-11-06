import { z } from 'zod'
import { network, type Network } from './common'

export const WALLET_TYPES = ['metamask', 'coinbase', 'walletconnect'] as const
export const walletType = z.enum(WALLET_TYPES)
export type WalletType = z.infer<typeof walletType>

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
  walletconnect: 'WalletConnect',
}

export const WALLET_SLOTS = ['primary', 'secondary'] as const
export const walletSlot = z.enum(WALLET_SLOTS)
export type WalletSlot = z.infer<typeof walletSlot>

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export function isValidAddress(address: string, target: Network) {
  return target === 'solana' ? SOLANA_ADDRESS.test(address) : EVM_ADDRESS.test(address)
}

/** Campos comuns ao cadastro de carteira e aos dados do colecionador no pagamento. */
export const walletFields = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição.').max(40, 'Use até 40 caracteres.'),
  network: network,
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.').max(40, 'Use até 40 caracteres.'),
  address: z.string().trim().min(1, 'Informe o endereço da carteira.'),
  ensSecondary: z.string().trim().max(64, 'Use até 64 caracteres.'),
  walletType: walletType,
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4,12}$/, 'Use de 4 a 12 letras ou números.'),
  email: z.email('Informe um e-mail válido.'),
  ensName: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,32}$/, 'Use de 3 a 32 letras minúsculas, números ou hífen.'),
})

/** O endereço depende da rede: 0x… em redes EVM, base58 na Solana. */
export function refineAddress<T extends { address: string; network: Network }>(values: T, ctx: z.RefinementCtx) {
  if (!isValidAddress(values.address, values.network)) {
    ctx.addIssue({
      code: 'custom',
      path: ['address'],
      message:
        values.network === 'solana'
          ? 'Endereço Solana inválido (base58, 32 a 44 caracteres).'
          : 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais.',
    })
  }
}

export const walletInput = walletFields
  .extend({ nickname: z.string().trim().min(2, 'Informe o apelido da carteira.').max(30, 'Use até 30 caracteres.') })
  .superRefine(refineAddress)
export type WalletInput = z.infer<typeof walletInput>

export const wallet = walletFields.extend({
  slot: walletSlot,
  nickname: z.string(),
  updatedAt: z.iso.datetime({ offset: true }),
})
export type Wallet = z.infer<typeof wallet>

export const walletsResponse = z.object({ primary: wallet.nullable(), secondary: wallet.nullable() })
export type WalletsResponse = z.infer<typeof walletsResponse>

/* ---------- Conexão simulada ---------- */

export const connectWalletRequest = z.object({
  provider: walletType,
  network,
  address: z.string(),
})

export const walletConnection = z.object({
  connectionId: z.string(),
  provider: walletType,
  network,
  address: z.string(),
  expiresAt: z.iso.datetime({ offset: true }),
})
export type WalletConnection = z.infer<typeof walletConnection>
