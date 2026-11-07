import { USERS, expect, reachReview, test } from './fixtures'

test.describe('6. Compra completa do catálogo ao recibo', () => {
  test('catálogo → detalhe → carrinho → pagamento → recibo confirmado', async ({ app, page }) => {
    await app.start('/')
    await app.loginByApi(USERS.ana)
    await app.goto('/')

    await page.getByRole('link', { name: 'Emerald Ape #042' }).first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
    await page.getByRole('button', { name: app.isMobile() ? 'Comprar NFT' : 'COMPRAR' }).click()

    await expect(page).toHaveURL(/\/carrinho$/)
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/pagamento$/)

    await reachReview(app)
    const review = page.getByRole('dialog', { name: 'Revise seu pedido' })
    await expect(review).toContainText('2.38 ETH')
    await expect(review).toContainText('2.396 ETH')
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    await expect(page).toHaveURL(/\/pedido\/ord_/)
    await expect(page.getByRole('heading', { name: 'Processando seu pagamento' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
      timeout: 15_000,
    })
    const receipt = page.getByRole('region', { name: 'Recibo do pedido' })
    await expect(receipt).toContainText('Emerald Ape #042')
    await expect(receipt).toContainText('2.396 ETH')

    // O recibo é o snapshot do pedido: mudar o catálogo depois não altera os valores.
    await page.evaluate(() => window.__mocks!.updateEdition('emerald-ape-042', '1-50', { priceEth: '9.99' }))
    await page.reload()
    await app.waitForMocks()
    await expect(page.getByRole('region', { name: 'Recibo do pedido' })).toContainText('2.396 ETH')

    // Só os itens comprados saíram do carrinho.
    await app.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })
})
