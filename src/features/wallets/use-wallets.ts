import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as walletsApi from '@/api/wallets'
import type { WalletInput, WalletSlot, WalletsResponse } from '@/api/contracts/wallets'
import { useSession } from '@/features/auth/session'
import { queryKeys } from '@/lib/query-keys'

export function useWallets() {
  const { user } = useSession()
  return useQuery({
    queryKey: queryKeys.user.wallets(user?.id ?? 'anonymous'),
    queryFn: ({ signal }) => walletsApi.fetchWallets(signal),
    enabled: user !== null,
    staleTime: 60_000,
  })
}

export function useSaveWallet() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return useMutation({
    mutationFn: ({ slot, input }: { slot: WalletSlot; input: WalletInput }) => walletsApi.saveWallet(slot, input),
    onSuccess: (wallets) => {
      if (user) queryClient.setQueryData<WalletsResponse>(queryKeys.user.wallets(user.id), wallets)
    },
  })
}

export function useRemoveWallet() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return useMutation({
    mutationFn: (slot: WalletSlot) => walletsApi.removeWallet(slot),
    onSuccess: (wallets) => {
      if (user) queryClient.setQueryData<WalletsResponse>(queryKeys.user.wallets(user.id), wallets)
    },
  })
}
