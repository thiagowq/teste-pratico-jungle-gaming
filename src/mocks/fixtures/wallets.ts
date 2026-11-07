import type { Wallet } from '@/api/contracts/wallets'

/** Carteiras da Ana, como no frame mobile de pagamento (Principal e Reserva). */
export function buildWalletFixtures(): Record<string, { primary: Wallet | null; secondary: Wallet | null }> {
  const updatedAt = '2026-10-20T12:00:00.000Z'
  return {
    'user-ana': {
      primary: {
        slot: 'primary',
        nickname: 'Principal',
        displayName: 'Ana Colecionadora',
        network: 'ethereum',
        profileName: 'Ana Kurio',
        address: '0xA91F3c2B7d4E5f60718293a4b5C6d7E8f9a0E82C',
        ensSecondary: '',
        walletType: 'metamask',
        referralCode: 'KURIO2026',
        email: 'colecionador@kurio.test',
        ensName: 'ana',
        updatedAt,
      },
      secondary: {
        slot: 'secondary',
        nickname: 'Reserva',
        displayName: 'Ana Colecionadora',
        network: 'polygon',
        profileName: 'Ana Kurio',
        address: '0x5B2e9D41c7A3F08e6d92B1c4E7a03F5d8C6b1A27',
        ensSecondary: 'nova.kurio.eth',
        walletType: 'coinbase',
        referralCode: 'KURIO2026',
        email: 'colecionador@kurio.test',
        ensName: 'nova',
        updatedAt,
      },
    },
  }
}
