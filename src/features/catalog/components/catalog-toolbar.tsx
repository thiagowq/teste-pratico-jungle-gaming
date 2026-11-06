import { NFT_SORTS, NFT_SORT_LABELS, NFT_TABS, type NftListParams } from '@/api/contracts/catalog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const TAB_LABELS: Record<(typeof NFT_TABS)[number], string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

export function CatalogTabs({
  params,
  onChange,
  className,
}: {
  params: NftListParams
  onChange: (patch: Partial<NftListParams>) => void
  className?: string
}) {
  const current = params.tab ?? 'all'
  return (
    <nav aria-label="Seleção do catálogo" className={className}>
      <ul className="flex gap-4 md:gap-5">
        {NFT_TABS.map((tab) => {
          const active = tab === current
          return (
            <li key={tab}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ tab: tab === 'all' ? undefined : tab })}
                className={cn(
                  'relative pb-1 text-sm leading-4 whitespace-nowrap transition-colors hover:text-brand-accent md:text-[15px] md:font-medium',
                  active
                    ? 'font-bold text-brand-accent after:absolute after:inset-x-0 after:-bottom-[5px] after:h-0.5 after:bg-brand'
                    : 'text-foreground',
                )}
              >
                {TAB_LABELS[tab]}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function CatalogSort({
  params,
  onChange,
  className,
}: {
  params: NftListParams
  onChange: (patch: Partial<NftListParams>) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1 text-[15px] leading-5', className)}>
      <span id="sort-label">Ordenar por:</span>
      <Select
        value={params.sort ?? 'recent'}
        onValueChange={(value) => onChange({ sort: value === 'recent' ? undefined : (value as NftListParams['sort']) })}
      >
        <SelectTrigger
          aria-labelledby="sort-label"
          className="h-auto gap-1 border-none bg-transparent p-0 text-[15px] shadow-none hover:text-brand-accent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {NFT_SORTS.map((sort) => (
            <SelectItem key={sort} value={sort}>
              {NFT_SORT_LABELS[sort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
