import { Tabs as TabsPrimitive } from 'radix-ui'
import type { NftDetail } from '@/api/contracts/catalog'
import { RatingStars } from '@/components/rating-stars'
import { cn } from '@/lib/utils'

export type DetailTab = 'detalhes' | 'avaliacoes'

const trigger =
  'relative pb-3 text-[17px] leading-4 whitespace-nowrap text-foreground transition-colors hover:text-brand-accent data-[state=active]:font-bold data-[state=active]:text-brand-accent data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-[3px] data-[state=active]:after:bg-brand'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export function DetailTabs({
  nft,
  tab,
  onTabChange,
}: {
  nft: NftDetail
  tab: DetailTab
  onTabChange: (tab: DetailTab) => void
}) {
  return (
    <TabsPrimitive.Root
      id="abas-detalhe"
      value={tab}
      onValueChange={(value) => onTabChange(value as DetailTab)}
      className="scroll-mt-6"
    >
      <TabsPrimitive.List
        aria-label="Informações do NFT"
        className="flex gap-8 overflow-x-auto border-b border-brand/40"
      >
        <TabsPrimitive.Trigger value="detalhes" className={trigger}>
          Detalhes do NFT
        </TabsPrimitive.Trigger>
        <TabsPrimitive.Trigger value="avaliacoes" className={trigger}>
          Avaliações de colecionadores ({nft.rating.count})
        </TabsPrimitive.Trigger>
      </TabsPrimitive.List>

      <TabsPrimitive.Content value="detalhes" className="pt-3 text-sm leading-6 text-text-secondary">
        {nft.longDescription.map((paragraph, index) => (
          <p key={index} className={cn(index > 0 && 'mt-6')}>
            {paragraph}
          </p>
        ))}
        <dl className="mt-3 flex flex-col gap-3">
          {nft.specs.map((spec) => (
            <div key={spec.label}>
              <dt className="font-bold text-foreground">{spec.label}:</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
        </dl>
      </TabsPrimitive.Content>

      <TabsPrimitive.Content value="avaliacoes" className="pt-4">
        {nft.reviews.length === 0 ? (
          <p className="text-sm text-text-secondary">Este NFT ainda não recebeu avaliações.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {nft.reviews.map((review) => (
              <li key={review.id} className="rounded-md border border-border bg-surface-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">{review.author}</p>
                  <RatingStars average={review.rating} />
                </div>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{review.comment}</p>
                <p className="mt-2 text-xs text-tan">
                  <time dateTime={review.createdAt}>{dateFormat.format(new Date(review.createdAt))}</time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  )
}
