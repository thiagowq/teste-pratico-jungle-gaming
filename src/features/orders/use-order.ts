import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchOrder, fetchPendingOrders } from '@/api/checkout'
import type { ApiError } from '@/api/errors'
import { useSession } from '@/features/auth/session'
import { queryKeys } from '@/lib/query-keys'
import { realtime } from '@/realtime/socket'

/**
 * Pedido acompanhado em tempo real. O evento `order.updated` dispara a
 * reconciliação com a API REST (fonte da verdade); enquanto pendente, uma
 * consulta periódica cobre quedas do socket. Pedidos confirmados ou recusados
 * são terminais e param de ser consultados.
 */
export function useOrder(orderId: string) {
  const { user } = useSession()
  const queryClient = useQueryClient()
  const key = queryKeys.user.order(user?.id ?? 'anonymous', orderId)

  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    enabled: user !== null,
    refetchInterval: (current) => (current.state.data?.status === 'pending' ? 3_000 : false),
    retry: (failureCount, error) => (error as ApiError).code !== 'NOT_FOUND' && failureCount < 2,
  })

  const order = query.data
  useEffect(() => {
    if (order) realtime.observeVersion({ type: 'order', id: order.id }, order.version)
  }, [order])

  useEffect(() => {
    const refresh = () => void queryClient.invalidateQueries({ queryKey: key })
    const offEvent = realtime.on('order.updated', (event) => {
      if (event.resource.id === orderId) refresh()
    })
    const offReconnect = realtime.onReconnect(refresh)
    return () => {
      offEvent()
      offReconnect()
    }
    // A chave muda junto com o usuário e o pedido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, user?.id, queryClient])

  return query
}

/** Pedido em processamento do usuário, para retomada após refresh ou reconexão. */
export function usePendingOrder() {
  const { user } = useSession()
  return useQuery({
    queryKey: queryKeys.user.pendingOrders(user?.id ?? 'anonymous'),
    queryFn: ({ signal }) => fetchPendingOrders(signal),
    enabled: user !== null,
    select: (data) => data.items[0] ?? null,
    staleTime: 0,
  })
}
