import { NETWORK_LABELS } from '@/api/contracts/common'
import { WALLET_TYPE_LABELS, type WalletType } from '@/api/contracts/wallets'
import { WalletIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { ConnectionState } from './use-checkout'

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

const PROVIDERS: Array<{ id: WalletType; mark: React.ReactNode }> = [
  { id: 'walletconnect', mark: 'W' },
  { id: 'metamask', mark: 'M' },
  { id: 'coinbase', mark: <WalletIcon aria-hidden className="size-5" /> },
]

interface WalletProvidersProps {
  provider: WalletType | null
  connection: ConnectionState
  connectionMatches: boolean
  onConnect: (provider: WalletType) => void
  onDisconnect: () => void
  variant: 'desktop' | 'mobile'
}

/**
 * "Carteira e rede": escolher o provedor dispara a conexão simulada pela API,
 * que pode ser aceita, recusada ou desfeita. O estado é anunciado a leitores de tela.
 */
export function WalletProviders({
  provider,
  connection,
  connectionMatches,
  onConnect,
  onDisconnect,
  variant,
}: WalletProvidersProps) {
  const busy = connection.status === 'connecting'
  return (
    <div className="flex flex-col gap-4">
      <div
        id="wallet-providers"
        tabIndex={-1}
        role="radiogroup"
        aria-label="Provedor da carteira"
        className="flex flex-col gap-4 outline-none"
      >
        {PROVIDERS.map((item) => {
          const selected = provider === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={WALLET_TYPE_LABELS[item.id]}
              disabled={busy}
              onClick={() => onConnect(item.id)}
              className={cn(
                'flex items-center gap-3 border text-left transition-colors disabled:cursor-progress',
                variant === 'desktop'
                  ? 'h-[45px] rounded-[3px] px-3 text-[15px]'
                  : 'h-16 flex-row-reverse justify-between rounded-[14px] bg-surface-card px-4 text-sm',
                selected ? 'border-brand' : 'border-border hover:border-brand/60',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-4 shrink-0 place-items-center rounded-full border-[1.2px] border-brand',
                  variant === 'mobile' && 'size-[17px]',
                )}
              >
                {selected && <span className="size-2.5 rounded-full bg-brand" />}
              </span>
              <span className="flex items-center gap-3">
                {variant === 'mobile' && (
                  <span
                    aria-hidden
                    className="grid size-10 place-items-center rounded-full border border-border bg-surface-raised font-bold text-brand-accent"
                  >
                    {item.mark}
                  </span>
                )}
                {item.id === 'walletconnect' && variant === 'desktop' ? (
                  <span className="rounded-md border border-border-soft bg-surface-dark px-2 py-1.5 text-[9px] leading-3 font-bold tracking-[0.01em] text-brand-accent">
                    METAMASK&nbsp; •&nbsp; WALLETCONNECT&nbsp; •&nbsp; COINBASE
                  </span>
                ) : (
                  WALLET_TYPE_LABELS[item.id]
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div role="status" aria-live="polite" className="min-h-5 text-sm">
        {connection.status === 'connecting' && (
          <span className="text-text-secondary">
            Conectando à {WALLET_TYPE_LABELS[connection.provider]}… confirme no app da carteira.
          </span>
        )}
        {connection.status === 'connected' && (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={connectionMatches ? 'text-success' : 'text-amber'}>
              {connectionMatches
                ? `Conectada: ${shortAddress(connection.connection.address)} na ${NETWORK_LABELS[connection.connection.network]}`
                : 'A rede ou o endereço mudaram. Conecte novamente.'}
            </span>
            <button type="button" onClick={onDisconnect} className="text-brand-accent underline">
              Desconectar
            </button>
          </span>
        )}
        {(connection.status === 'rejected' || connection.status === 'error') && (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-coral">
            {connection.message}
            <button
              type="button"
              onClick={() => onConnect(connection.provider)}
              className="text-brand-accent underline"
            >
              Tentar novamente
            </button>
          </span>
        )}
        {connection.status === 'idle' && (
          <span className="text-text-secondary">
            {provider
              ? `Toque em ${WALLET_TYPE_LABELS[provider]} para conectar a carteira.`
              : 'Escolha um provedor para conectar a carteira.'}
          </span>
        )}
      </div>
    </div>
  )
}
