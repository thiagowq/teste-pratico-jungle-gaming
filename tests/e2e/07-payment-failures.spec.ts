import { USERS, expect, reachReview, test, type App } from './fixtures'

async function checkoutWithItems(app: App, scenario: Parameters<App['start']>[1] = 'instant') {
  await app.start('/', scenario)
  await app.loginByApi(USERS.ana)
  await app.addToCartByApi([
    { nftId: 'emerald-ape-042', quantity: 2 },
    { nftId: 'golden-beat-207', quantity: 1 },
  ])
  await app.goto('/pagamento')
}

test.describe('7. Falha de pagamento, clique repetido e timeout com recuperação', () => {
  test('pagamento recusado mostra a recusa e preserva o carrinho', async ({ app, page }) => {
    await checkoutWithItems(app, 'payment-declined')
    await reachReview(app)
    await page.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(page.getByText('Emerald Ape #042').first()).toBeVisible()
    await expect(page.getByText('Golden Beat #207').first()).toBeVisible()
  })

  test('cliques repetidos criam um único pedido', async ({ app, page }) => {
    await checkoutWithItems(app)
    await reachReview(app)
    // Três cliques síncronos, como um duplo clique nervoso.
    await page.evaluate(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>('[role=dialog] button')].find((element) =>
        element.textContent?.includes('Confirmar e pagar'),
      )!
      button.click()
      button.click()
      button.click()
    })
    await expect(page).toHaveURL(/\/pedido\/ord_/)
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
      timeout: 15_000,
    })
    expect(await app.ordersCount()).toBe(1)
  })

  test('timeout após a criação recupera o mesmo pedido pela chave de idempotência', async ({ app, page }) => {
    await checkoutWithItems(app, 'order-timeout')
    await reachReview(app)
    await page.getByRole('button', { name: 'Confirmar e pagar' }).click()
    // A primeira resposta se perde (timeout de 8 s); a nova tentativa usa a mesma chave.
    await expect(page).toHaveURL(/\/pedido\/ord_/, { timeout: 30_000 })
    expect(await app.ordersCount()).toBe(1)
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('carteira recusa a conexão e permite tentar de novo', async ({ app, page }) => {
    await checkoutWithItems(app, 'wallet-rejects')
    await page.getByRole('radio', { name: 'Coinbase Wallet', exact: true }).click()
    await expect(page.getByText('A conexão foi recusada na carteira. Tente novamente.')).toBeVisible()
    await page.evaluate(() => window.__mocks!.setScenario('instant'))
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('status').filter({ hasText: /Conectada/ })).toBeVisible()
  })

  test('cotação expirada (relógio controlado) exige nova confirmação', async ({ app, page }) => {
    await page.clock.install()
    await checkoutWithItems(app)
    await reachReview(app)
    await page.clock.fastForward('06:00')
    await page.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('A cotação expirou')
    expect(await app.ordersCount()).toBe(0)
  })
})
