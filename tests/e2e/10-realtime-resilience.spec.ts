import { USERS, expect, reachReview, test } from './fixtures'

/** Preço da edição selecionada no detalhe (desktop: ao lado do título; mobile: barra de compra). */
const price = (page: import('@playwright/test').Page) => page.getByTestId('nft-price')

test.describe('10. Eventos duplicados/antigos, desconexão e retomada de pedido pendente', () => {
  test('evento duplicado ou com versão antiga não regride o estado', async ({ app, page }) => {
    await app.start('/nft/emerald-ape-042')
    await page.evaluate(() => window.__mocks!.updateEdition('emerald-ape-042', '1-50', { priceEth: '1.49' }))
    await expect(price(page)).toContainText('1.49 ETH')

    await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('nft-mock:db:v4')!)
      const version = stored.nfts['emerald-ape-042'].version
      const old = {
        id: 'evt-antigo',
        type: 'nft.updated' as const,
        resource: { type: 'nft' as const, id: 'emerald-ape-042' },
        version: version - 1,
        occurredAt: new Date().toISOString(),
        data: { editions: [{ id: '1-50', priceEth: '0.01', available: 99 }] },
      }
      window.__mocks!.emit(old)
      window.__mocks!.emit(old)
    })
    await page.waitForTimeout(500)
    await expect(price(page)).toContainText('1.49 ETH')
  })

  test('queda do tempo real: indicador e reconciliação via REST ao reconectar', async ({ app, page }) => {
    await app.start('/nft/golden-beat-207')
    await expect(price(page)).toContainText('0.99 ETH')
    await page.evaluate(() => window.__mocks!.socketOutage(4000))
    await expect(page.getByText('Reconectando ao tempo real…')).toBeVisible()
    // Mudança durante a queda: o evento se perde.
    await page.evaluate(() => window.__mocks!.updateEdition('golden-beat-207', '1-50', { priceEth: '0.89' }))
    await expect(price(page)).toContainText('0.99 ETH')
    // Ao reconectar, as consultas ativas são reconciliadas com a API.
    await expect(page.getByText('Tempo real reconectado')).toBeVisible({ timeout: 20_000 })
    await expect(price(page)).toContainText('0.89 ETH')
  })

  test('pedido pendente sobrevive a queda e refresh sem criar outra compra', async ({ app, page }) => {
    await app.start('/')
    await app.loginByApi(USERS.ana)
    await app.addToCartByApi([{ nftId: 'sage-nomad-009', quantity: 1 }])
    await page.evaluate(() => window.__mocks!.updateScenario({ network: 'normal' }))
    await app.goto('/pagamento')
    await reachReview(app)
    await page.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page.getByRole('heading', { name: 'Processando seu pagamento' })).toBeVisible()

    await page.evaluate(() => window.__mocks!.socketOutage(3000))
    await page.reload()
    await app.waitForMocks()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
      timeout: 20_000,
    })
    expect(await app.ordersCount()).toBe(1)

    // De volta ao pagamento, nada pendente e nenhuma compra nova.
    await app.goto('/pagamento')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })
})
