import { z } from 'zod'

/**
 * Valores em ETH trafegam como string decimal (nunca number) para preservar a
 * precisão. Até 18 casas, como o wei.
 */
export const ethAmount = z.string().regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido')
export type EthAmount = z.infer<typeof ethAmount>

export const isoDate = z.iso.datetime({ offset: true })

export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export const network = z.enum(NETWORKS)
export type Network = z.infer<typeof network>

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const pagination = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
})
