import { z } from 'zod'
import { nftSummary } from './catalog'

/** Ids para marcar corações em qualquer lista e os NFTs completos para a "Lista de interesse". */
export const favoritesResponse = z.object({ nftIds: z.array(z.string()), items: z.array(nftSummary) })
export type FavoritesResponse = z.infer<typeof favoritesResponse>
