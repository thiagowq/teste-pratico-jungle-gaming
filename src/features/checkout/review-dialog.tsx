import Decimal from 'decimal.js'
import type { Quote } from '@/api/contracts/checkout'
import { NETWORK_LABELS } from '@/api/contracts/common'
import { WALLET_TYPE_LABELS, type WalletConnection } from '@/api/contracts/wallets'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatEth } from '@/lib/format'
import { OrderLines } from './order-lines'

const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

interface ReviewDialogProps {
  quote: Quote | null
  connection: WalletConnection | null
  notice: string | null
  submitting: boolean
  submitStatus: string | null
  onConfirm: () => void
  onClose: () => void
}

/**
 * Revisão antes do envio: os valores exibidos são os da cotação do servidor.
 * Se mudarem na confirmação, a nova cotação aparece aqui com um aviso e exige
 * nova confirmação.
 */
export function ReviewDialog({
  quote,
  connection,
  notice,
  submitting,
  submitStatus,
  onConfirm,
  onClose,
}: ReviewDialogProps) {
  return (
    <Dialog open={quote !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto border-border bg-surface-card sm:max-w-[560px]">
        {quote && (
          <>
            <DialogTitle className="text-xl font-bold">Revise seu pedido</DialogTitle>
            <DialogDescription className="text-sm text-text-secondary">
              Valores garantidos até {time.format(new Date(quote.expiresAt))}. Confirme para enviar o pagamento.
            </DialogDescription>

            {notice && (
              <p role="alert" className="rounded-md border border-amber/60 bg-amber/10 p-3 text-sm text-amber">
                {notice}
              </p>
            )}

            <OrderLines
              compact
              lines={quote.items.map((item) => ({ ...item, key: `${item.nftId}-${item.editionId}` }))}
            />

            <dl className="flex flex-col gap-2 border-t border-brand/40 pt-4 text-[15px]">
              <div className="flex justify-between">
                <dt>Rede</dt>
                <dd>{NETWORK_LABELS[quote.network]}</dd>
              </div>
              {connection && (
                <div className="flex justify-between">
                  <dt>Carteira</dt>
                  <dd>
                    {WALLET_TYPE_LABELS[connection.provider]} · {connection.address.slice(0, 6)}…
                    {connection.address.slice(-4)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatEth(quote.summary.subtotalEth)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Desconto{quote.couponCode ? ` (${quote.couponCode})` : ''}</dt>
                <dd>
                  (-) {new Decimal(quote.summary.discountEth).gt(0) ? formatEth(quote.summary.discountEth) : '0.00'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Taxa de rede</dt>
                <dd>{formatEth(quote.summary.networkFeeEth)}</dd>
              </div>
              <div className="mt-2 flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd className="text-brand-accent">{formatEth(quote.summary.totalEth)}</dd>
              </div>
            </dl>

            <p role="status" aria-live="polite" className="min-h-5 text-sm text-text-secondary">
              {submitStatus}
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Voltar
              </Button>
              <Button onClick={onConfirm} disabled={submitting} aria-busy={submitting}>
                {submitting ? 'Processando…' : 'Confirmar e pagar'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
