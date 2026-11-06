import Decimal from 'decimal.js'

/**
 * Valor em ETH como no layout: ponto decimal e sufixo ("1.19 ETH"). Recebe a
 * string decimal da API e preserva as casas enviadas ("11.90" continua "11.90").
 */
export function formatEth(value: string, decimals?: number) {
  return `${decimals === undefined ? value : new Decimal(value).toFixed(decimals)} ETH`
}

/** Valor com vírgula decimal, usado em rótulos em português ("0,02 - 12,30 ETH"). */
export function formatEthPtBr(value: string, decimals = 2) {
  return new Decimal(value).toFixed(decimals).replace('.', ',')
}

export function formatCount(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}
