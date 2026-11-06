import { NftImage } from '@/components/nft-image'
import type { Artwork } from '@/api/contracts/catalog'
import { formatEth } from '@/lib/format'

export interface Line {
  key: string
  name: string
  tokenId: string
  artwork: Artwork
  editionLabel: string
  quantity: number
  lineTotalEth: string
}

/** Lista "Seus NFTs" (pagamento) e "Detalhes da transação" (recibo). */
export function OrderLines({ lines, compact = false }: { lines: Line[]; compact?: boolean }) {
  return (
    <ul className="flex flex-col gap-3">
      {lines.map((line) => (
        <li
          key={line.key}
          className={compact ? 'flex items-center gap-3' : 'flex items-center gap-2 bg-surface-card py-0 pr-4 pl-1'}
        >
          <NftImage artwork={line.artwork} alt="" sizes="70px" className="size-[70px] shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="truncate text-base leading-4 font-bold">{line.name}</span>
            <span className="truncate text-sm leading-4 text-tan">
              <span className="sr-only">ID do token: </span>
              {line.tokenId} · Edição {line.editionLabel}
            </span>
          </div>
          <span className="shrink-0 text-sm leading-4 text-text-secondary">
            <span className="sr-only">Quantidade: </span>(x {line.quantity})
          </span>
          <span className="shrink-0 text-right text-lg leading-4 font-bold whitespace-nowrap text-brand-accent">
            <span className="sr-only">Subtotal: </span>
            {formatEth(line.lineTotalEth)}
          </span>
        </li>
      ))}
    </ul>
  )
}
