import Decimal from 'decimal.js'

/** Valor em ETH como no layout: ponto decimal e sufixo ("1.19 ETH"). Recebe string decimal. */
export function formatEth(value: string, decimals?: number) {
  const amount = new Decimal(value)
  return `${decimals === undefined ? amount.toString() : amount.toFixed(decimals)} ETH`
}

/** Valor com vírgula decimal, usado em rótulos em português ("0,02 - 12,30 ETH"). */
export function formatEthPtBr(value: string, decimals = 2) {
  return new Decimal(value).toFixed(decimals).replace('.', ',')
}

export function formatCount(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}
