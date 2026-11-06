import type { Wallet, WalletInput } from '@/api/contracts/wallets'

export const EMPTY_WALLET: WalletInput = {
  nickname: '',
  displayName: '',
  network: 'ethereum',
  profileName: '',
  address: '',
  ensSecondary: '',
  walletType: 'metamask',
  referralCode: '',
  email: '',
  ensName: '',
}

/** Campos editáveis de uma carteira salva. */
export function toInput(wallet: Wallet): WalletInput {
  return {
    nickname: wallet.nickname,
    displayName: wallet.displayName,
    network: wallet.network,
    profileName: wallet.profileName,
    address: wallet.address,
    ensSecondary: wallet.ensSecondary,
    walletType: wallet.walletType,
    referralCode: wallet.referralCode,
    email: wallet.email,
    ensName: wallet.ensName,
  }
}
