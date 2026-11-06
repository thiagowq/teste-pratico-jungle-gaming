import { z } from 'zod'

export const favoritesResponse = z.object({ nftIds: z.array(z.string()) })
export type FavoritesResponse = z.infer<typeof favoritesResponse>
