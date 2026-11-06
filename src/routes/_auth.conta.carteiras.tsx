import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { WalletInput } from '@/api/contracts/wallets'
import { Button } from '@/components/ui/button'
import { useWallets } from '@/features/wallets/use-wallets'
import { WalletForm } from '@/features/wallets/wallet-form'
import { EMPTY_WALLET, toInput } from '@/features/wallets/wallet-input'

export const Route = createFileRoute('/_auth/conta/carteiras')({
  head: () => ({ meta: [{ title: 'Carteiras | Kurio' }] }),
  component: WalletsPage,
})

function WalletsPage() {
  const query = useWallets()
  const [secondaryDraft, setSecondaryDraft] = useState<WalletInput | null>(null)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

  if (query.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-[420px]" />
        <span role="status" className="sr-only">
          Carregando carteiras…
        </span>
      </div>
    )
  }
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="font-bold">Não foi possível carregar suas carteiras.</p>
        <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  const { primary, secondary } = query.data
  const startSecondary = () => {
    // "Igual à carteira principal": parte dos dados da principal, sem repetir o endereço.
    const base = sameAsPrimary && primary ? { ...toInput(primary), address: '', nickname: 'Reserva' } : EMPTY_WALLET
    setSecondaryDraft(base)
  }

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="primary-heading" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 id="primary-heading" className="text-base leading-4 font-bold">
            Carteira principal
          </h1>
          <p className="text-sm text-text-secondary">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
        </div>
        <WalletForm
          key={primary?.updatedAt ?? 'new'}
          slot="primary"
          initial={primary ? toInput(primary) : EMPTY_WALLET}
        />
      </section>

      <section aria-labelledby="secondary-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="secondary-heading" className="text-base leading-4 font-bold">
            Carteira secundária
          </h2>
          {!secondary && !secondaryDraft && (
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-[15px]">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={sameAsPrimary}
                  onChange={(event) => setSameAsPrimary(event.target.checked)}
                  disabled={!primary}
                />
                <span
                  aria-hidden
                  className="grid size-[17px] place-items-center rounded-full border-[1.2px] border-brand peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-brand-accent"
                />
                Igual à carteira principal
              </label>
              <Button variant="link" className="text-base font-bold" onClick={startSecondary} disabled={!primary}>
                Adicionar
              </Button>
            </div>
          )}
        </div>
        {secondary ? (
          <WalletForm key={secondary.updatedAt} slot="secondary" initial={toInput(secondary)} />
        ) : secondaryDraft ? (
          <WalletForm slot="secondary" initial={secondaryDraft} onSaved={() => setSecondaryDraft(null)} />
        ) : (
          <p className="text-sm text-text-secondary">
            {primary
              ? 'Você ainda não adicionou uma carteira secundária.'
              : 'Cadastre a carteira principal antes da secundária.'}
          </p>
        )}
      </section>
    </div>
  )
}
