import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { createOrder, createQuote } from '@/api/checkout'
import { connectWallet, disconnectWallet } from '@/api/wallets'
import { buyerForm, type BuyerForm, type Quote } from '@/api/contracts/checkout'
import type { Network } from '@/api/contracts/common'
import type { Wallet, WalletConnection, WalletSlot, WalletType, WalletsResponse } from '@/api/contracts/wallets'
import type { ApiError } from '@/api/errors'
import { useSession } from '@/features/auth/session'
import { queryKeys } from '@/lib/query-keys'
import { useZodForm } from '@/lib/use-zod-form'

const EMPTY: BuyerForm = {
  displayName: '',
  username: '',
  network: 'ethereum',
  profileName: '',
  address: '',
  ensSecondary: '',
  walletType: 'metamask',
  referralCode: '',
  email: '',
  ensName: '',
  note: '',
}

function fromWallet(wallet: Wallet, username: string, note = ''): BuyerForm {
  return {
    displayName: wallet.displayName,
    username,
    network: wallet.network,
    profileName: wallet.profileName,
    address: wallet.address,
    ensSecondary: wallet.ensSecondary,
    walletType: wallet.walletType,
    referralCode: wallet.referralCode,
    email: wallet.email,
    ensName: wallet.ensName,
    note,
  }
}

/* ---------- Rascunho e tentativa persistidos (sobrevivem a refresh e a novo login) ---------- */

interface Draft {
  values: BuyerForm
  slot: WalletSlot | 'manual'
  provider: WalletType | null
}

interface Attempt {
  key: string
  quoteId: string
}

const storage = {
  read<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  },
  write(key: string, value: unknown) {
    try {
      if (value === null) sessionStorage.removeItem(key)
      else sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Sem armazenamento: o rascunho vale só nesta visita.
    }
  },
}

/* ---------- Conexão da carteira ---------- */

export type ConnectionState =
  | { status: 'idle' }
  | { status: 'connecting'; provider: WalletType }
  | { status: 'connected'; connection: WalletConnection }
  | { status: 'rejected' | 'error'; provider: WalletType; message: string }

/**
 * Estado completo do checkout: dados do colecionador, carteira de origem,
 * conexão simulada, cotação revisada e envio idempotente do pedido.
 */
export function useCheckout(wallets: WalletsResponse) {
  const { user } = useSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const userId = user?.id ?? 'anonymous'
  const draftKey = `nft.checkout-draft:${userId}`
  const attemptKey = `nft.checkout-attempt:${userId}`

  // Estado inicial: rascunho salvo (ex.: após reautenticar) ou a carteira principal cadastrada.
  const [initial] = useState<Draft>(() => {
    const saved = storage.read<Draft>(draftKey)
    if (saved) return saved
    if (wallets.primary && user) {
      return {
        values: fromWallet(wallets.primary, user.username),
        slot: 'primary',
        provider: wallets.primary.walletType,
      }
    }
    return {
      values: {
        ...EMPTY,
        displayName: user?.displayName ?? '',
        username: user?.username ?? '',
        email: user?.email ?? '',
      },
      slot: 'manual',
      provider: null,
    }
  })
  const form = useZodForm(buyerForm, initial.values, 'checkout')
  const [slot, setSlot] = useState<Draft['slot']>(initial.slot)
  const [provider, setProvider] = useState<WalletType | null>(initial.provider)
  const [connection, setConnection] = useState<ConnectionState>({ status: 'idle' })
  const [quote, setQuote] = useState<Quote | null>(null)
  const [reviewNotice, setReviewNotice] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

  // Rascunho salvo a cada alteração.
  useEffect(() => {
    storage.write(draftKey, { values: form.values, slot, provider } satisfies Draft)
  }, [draftKey, form.values, slot, provider])

  const chooseSlot = (next: Draft['slot']) => {
    setSlot(next)
    const wallet = next === 'manual' ? null : wallets[next]
    if (wallet && user) {
      form.reset(fromWallet(wallet, user.username, form.values.note))
      setProvider(wallet.walletType)
    }
    void disconnect()
  }

  /* ----- Conexão simulada ----- */

  const connectMutation = useMutation({ mutationFn: connectWallet })

  const connect = (nextProvider: WalletType) => {
    setProvider(nextProvider)
    const { network, address } = form.values
    if (!address) {
      setConnection({
        status: 'error',
        provider: nextProvider,
        message: 'Informe o endereço da carteira antes de conectar.',
      })
      return
    }
    setConnection({ status: 'connecting', provider: nextProvider })
    connectMutation.mutate(
      { provider: nextProvider, network, address },
      {
        onSuccess: (result) => setConnection({ status: 'connected', connection: result }),
        onError: (error) => {
          const apiError = error as ApiError
          setConnection({
            status: apiError.code === 'WALLET_REJECTED' ? 'rejected' : 'error',
            provider: nextProvider,
            message: apiError.message,
          })
        },
      },
    )
  }

  async function disconnect() {
    if (connection.status === 'connected') {
      const { connectionId } = connection.connection
      setConnection({ status: 'idle' })
      await disconnectWallet(connectionId).catch(() => undefined)
    } else {
      setConnection({ status: 'idle' })
    }
  }

  // A conexão vale para a rede e o endereço com que foi feita.
  const connectionMatches =
    connection.status === 'connected' &&
    connection.connection.network === form.values.network &&
    connection.connection.address.toLowerCase() === form.values.address.trim().toLowerCase()

  /* ----- Revisão (cotação) ----- */

  const quoteMutation = useMutation({ mutationFn: (network: Network) => createQuote(network) })

  const review = () => {
    const data = form.validateNow()
    if (!data) {
      toast.error('Revise os dados do colecionador.')
      return
    }
    if (!connectionMatches) {
      toast.error(
        connection.status === 'connected'
          ? 'A rede ou o endereço mudaram. Conecte a carteira novamente.'
          : 'Conecte uma carteira para continuar.',
      )
      document.getElementById('wallet-providers')?.focus()
      return
    }
    setReviewNotice(null)
    quoteMutation.mutate(data.network, {
      onSuccess: (next) => setQuote(next),
      onError: (error) => handleOrderError(error as ApiError),
    })
  }

  /* ----- Envio idempotente ----- */

  const orderMutation = useMutation({
    mutationFn: async ({ body, key }: { body: Parameters<typeof createOrder>[0]; key: string }) => {
      // Timeout ou queda de rede: repete com a MESMA chave; o servidor devolve o pedido já criado.
      for (let attempt = 0; ; attempt++) {
        try {
          return await createOrder(body, key)
        } catch (error) {
          const apiError = error as ApiError
          if (!apiError.isRetryable || attempt >= 2) throw error
          setSubmitStatus('Verificando se o pedido foi registrado…')
        }
      }
    },
  })

  function handleOrderError(error: ApiError) {
    switch (error.code) {
      case 'PRICE_CHANGED': {
        const next = error.details.quote as Quote | undefined
        if (next) setQuote(next)
        storage.write(attemptKey, null)
        setReviewNotice(error.message)
        void queryClient.invalidateQueries({ queryKey: queryKeys.user.all })
        return
      }
      case 'QUOTE_EXPIRED':
        storage.write(attemptKey, null)
        setReviewNotice(error.message)
        quoteMutation.mutate(form.values.network, { onSuccess: (next) => setQuote(next) })
        return
      case 'OUT_OF_STOCK':
        setQuote(null)
        toast.error(error.message)
        void queryClient.invalidateQueries({ queryKey: queryKeys.user.all })
        void navigate({ to: '/carrinho' })
        return
      case 'IDEMPOTENCY_CONFLICT':
        storage.write(attemptKey, null)
        setReviewNotice('Esta tentativa já foi usada. Confirme novamente para enviar um novo pedido.')
        return
      case 'CONFLICT':
        if (error.details.reason === 'wallet-disconnected') {
          setQuote(null)
          setConnection({ status: 'idle' })
        }
        toast.error(error.message)
        return
      case 'VALIDATION_ERROR':
        setQuote(null)
        form.applyApiError(error)
        return
      default:
        if (!error.isAuthError) setReviewNotice(error.message)
    }
  }

  const confirm = () => {
    if (!quote || connection.status !== 'connected' || orderMutation.isPending) return
    const data = form.validateNow()
    if (!data) {
      setQuote(null)
      return
    }
    // Reaproveita a chave enquanto for a mesma cotação: cliques repetidos e reenvios não duplicam o pedido.
    const saved = storage.read<Attempt>(attemptKey)
    const key = saved?.quoteId === quote.id ? saved.key : crypto.randomUUID()
    storage.write(attemptKey, { key, quoteId: quote.id } satisfies Attempt)
    setSubmitStatus('Enviando pedido…')
    setReviewNotice(null)
    orderMutation.mutate(
      { body: { quoteId: quote.id, connectionId: connection.connection.connectionId, buyer: data }, key },
      {
        onSuccess: (order) => {
          storage.write(attemptKey, null)
          storage.write(draftKey, null)
          setQuote(null)
          void queryClient.invalidateQueries({ queryKey: queryKeys.user.all })
          void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all })
          void navigate({ to: '/pedido/$orderId', params: { orderId: order.id } })
        },
        onError: (error) => handleOrderError(error as ApiError),
        onSettled: () => setSubmitStatus(null),
      },
    )
  }

  return {
    form,
    slot,
    chooseSlot,
    provider,
    connection,
    connectionMatches,
    connect,
    disconnect,
    review,
    isQuoting: quoteMutation.isPending,
    quote,
    closeReview: () => !orderMutation.isPending && setQuote(null),
    reviewNotice,
    confirm,
    isSubmitting: orderMutation.isPending,
    submitStatus,
  }
}
