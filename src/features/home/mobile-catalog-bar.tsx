import { useEffect, useState } from 'react'
import type { NftListParams, NftListResponse } from '@/api/contracts/catalog'
import { FilterButtonIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
import { CatalogSort } from '@/features/catalog/components/catalog-toolbar'

interface MobileCatalogBarProps {
  params: NftListParams
  facets: NftListResponse['facets'] | undefined
  total: number | undefined
  onChange: (patch: Partial<NftListParams>, options?: { replace?: boolean }) => void
}

/**
 * Topo da tela inicial em telas pequenas: busca com debounce (atualiza a URL
 * sem empilhar histórico a cada tecla) e botão que abre os filtros numa gaveta.
 * Em tablet a gaveta também é usada, já que a barra lateral só cabe a partir de 1024px.
 */
export function MobileCatalogBar({ params, facets, total, onChange }: MobileCatalogBarProps) {
  const [term, setTerm] = useState(params.q ?? '')
  const [open, setOpen] = useState(false)
  const activeFilters = (params.categories?.length ?? 0) + (params.networks?.length ?? 0) + (params.minPrice || params.maxPrice ? 1 : 0)

  // Mantém o campo em sincronia quando a busca muda pela URL (voltar/avançar).
  const [lastQ, setLastQ] = useState(params.q)
  if (params.q !== lastQ) {
    setLastQ(params.q)
    setTerm(params.q ?? '')
  }

  useEffect(() => {
    const value = term.trim() || undefined
    if (value === params.q) return
    const timeout = window.setTimeout(() => onChange({ q: value }, { replace: true }), 350)
    return () => window.clearTimeout(timeout)
  }, [term, params.q, onChange])

  return (
    <div className="flex gap-2 lg:hidden">
      <form role="search" className="flex h-[45px] flex-1 items-center gap-2 rounded-[10px] bg-surface-card px-3 md:hidden" onSubmit={(event) => event.preventDefault()}>
        <SearchIcon aria-hidden className="size-[22px] shrink-0" color="var(--kurio-secondary)" />
        <label htmlFor="mobile-search" className="sr-only">
          Explorar coleções
        </label>
        <input
          id="mobile-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Explorar coleções"
          maxLength={80}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-foreground placeholder:text-tan focus:outline-none"
        />
      </form>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative grid size-[45px] shrink-0 place-items-center rounded-[14px] md:ml-auto"
        aria-label={activeFilters ? `Filtros e ordenação, ${activeFilters} ativos` : 'Filtros e ordenação'}
      >
        <FilterButtonIcon aria-hidden />
        {activeFilters > 0 && (
          <span aria-hidden className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-foreground text-[10px] font-bold text-ink">
            {activeFilters}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-border bg-surface-card">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Combine coleções, preço e rede. Os resultados atualizam na hora.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-8 px-4 pb-6">
            <CatalogSort params={params} onChange={onChange} />
            <CatalogFilters params={params} facets={facets} onChange={onChange} />
            <Button size="block" onClick={() => setOpen(false)}>
              {total === undefined ? 'Ver resultados' : `Ver ${total} resultados`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
