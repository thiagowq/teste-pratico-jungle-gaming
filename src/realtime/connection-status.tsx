import { useEffect, useState, useSyncExternalStore } from 'react'
import { realtime } from './socket'

function useConnectionStatus() {
  return useSyncExternalStore(
    (listener) => realtime.onStatus(listener),
    () => realtime.getStatus(),
    () => 'idle' as const,
  )
}

/**
 * Indicador discreto do tempo real: aparece só quando a conexão cai por mais
 * de um instante e avisa (de forma acessível) quando ela volta.
 */
export function ConnectionStatus() {
  const status = useConnectionStatus()
  const [visible, setVisible] = useState<'lost' | 'restored' | null>(null)

  useEffect(() => {
    if (status === 'reconnecting') {
      const timeout = window.setTimeout(() => setVisible('lost'), 1500)
      return () => window.clearTimeout(timeout)
    }
    if (status === 'connected') {
      const show = window.setTimeout(() => setVisible((current) => (current === 'lost' ? 'restored' : null)), 0)
      const hide = window.setTimeout(() => setVisible(null), 3000)
      return () => {
        window.clearTimeout(show)
        window.clearTimeout(hide)
      }
    }
  }, [status])

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 left-4 z-50 max-md:bottom-28">
      {visible && (
        <span className="flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-xs shadow-overlay">
          <span
            aria-hidden
            className={
              visible === 'lost' ? 'size-2 animate-pulse rounded-full bg-amber' : 'size-2 rounded-full bg-success'
            }
          />
          {visible === 'lost' ? 'Reconectando ao tempo real…' : 'Tempo real reconectado'}
        </span>
      )}
    </div>
  )
}
