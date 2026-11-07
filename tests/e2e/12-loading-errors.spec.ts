import { expect, test } from './fixtures'

test.describe('12. Skeletons em carregamento lento, falha e recuperação', () => {
  test('skeletons no catálogo e no detalhe enquanto a rede está lenta', async ({ app, page }) => {
    await app.start('/em-breve/inicio', 'slow')
    await page.goto('/?page=2')
    await expect(page.locator('#mercado .skeleton').filter({ visible: true }).first()).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Carregando NFTs…' })).toBeAttached()
    await expect(page.locator('#mercado article')).toHaveCount(9, { timeout: 10_000 })
    await expect(page.locator('#mercado .skeleton').filter({ visible: true })).toHaveCount(0)

    await page.goto('/nft/ivory-baron-088')
    await expect(page.locator('main[aria-busy="true"] .skeleton').filter({ visible: true }).first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Ivory Baron #088' })).toBeVisible({ timeout: 10_000 })
  })

  test('skeleton no resumo do carrinho', async ({ app, page }) => {
    await app.start('/em-breve/inicio', 'slow')
    await page.goto('/carrinho')
    await expect(page.locator('[aria-label="Carregando carrinho"] .skeleton').first()).toBeVisible()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible({ timeout: 10_000 })
  })

  test('falha persistente mostra erro e a nova tentativa recupera', async ({ app, page }) => {
    await app.start('/em-breve/inicio')
    await page.evaluate(() =>
      window.__mocks!.setFault('GET /nfts', { fault: { kind: 'http', status: 503, code: 'TRANSIENT' } }),
    )
    await page.goto('/?page=3')
    await expect(page.getByText('Não foi possível carregar o catálogo')).toBeVisible({ timeout: 10_000 })
    await page.evaluate(() => window.__mocks!.setFault('GET /nfts', null))
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.locator('#mercado article')).toHaveCount(9)
  })

  test('sem conexão: o detalhe informa e recupera', async ({ app, page }) => {
    await app.start('/em-breve/inicio')
    await page.evaluate(() => window.__mocks!.setFault('GET /nfts/:id', { fault: { kind: 'offline' }, times: 3 }))
    await page.goto('/nft/sage-nomad-009')
    await expect(page.getByText('Sem conexão com o servidor. Verifique sua internet.')).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Sage Nomad #009' })).toBeVisible()
  })
})
