import { USERS, expect, reachReview, test } from './fixtures'

test.describe('9. Preço e disponibilidade via Socket.IO durante o checkout', () => {
  test('mudança de preço com o NFT no carrinho: aviso, resumo atualizado e checkout protegido', async ({
    app,
    page,
  }) => {
    await app.start('/')
    await app.loginByApi(USERS.ana)
    await app.addToCartByApi([{ nftId: 'emerald-ape-042', quantity: 2 }])

    // 1-2. NFT no carrinho; o preço muda enquanto o usuário navega no detalhe.
    await app.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await app.waitForRealtime()
    await page.evaluate(() => window.__mocks!.updateEdition('emerald-ape-042', '1-50', { priceEth: '1.49' }))

    // 3. A interface informa a alteração (aviso acessível) e atualiza o preço.
    await expect(page.getByText('O preço de Emerald Ape #042 (edição 1/50) mudou de 1.19 para 1.49 ETH.')).toBeVisible()
    await expect(page.getByText('1.49 ETH').first()).toBeVisible()

    // O carrinho mostra o resumo novo e bloqueia a finalização até a confirmação.
    await app.goto('/carrinho')
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'Preço ou disponibilidade mudaram. Confirme as alterações para continuar.' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()
    await page.getByRole('button', { name: 'Confirmar alterações' }).click()
    await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeEnabled()
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()

    // 4. Com a revisão aberta, a cotação desatualizada é refeita e exige nova confirmação.
    await reachReview(app)
    const review = page.getByRole('dialog', { name: 'Revise seu pedido' })
    await expect(review).toContainText('2.996 ETH')
    await app.waitForRealtime()
    await page.evaluate(() => window.__mocks!.updateEdition('emerald-ape-042', '1-50', { priceEth: '1.59' }))
    await expect(review.getByRole('alert')).toContainText('mudou agora')
    await expect(review).toContainText('3.196 ETH')
    expect(await app.ordersCount()).toBe(0)

    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page).toHaveURL(/\/pedido\/ord_/)
    expect(await app.ordersCount()).toBe(1)
  })

  test('edição esgotada por evento aparece como esgotada no detalhe', async ({ app, page }) => {
    await app.start('/nft/emerald-ape-042?edicao=1-10')
    await expect(page.getByRole('radio', { name: /Edição 1\/10, \d+ disponíveis/ })).toBeVisible()
    await app.waitForRealtime()
    await page.evaluate(() => window.__mocks!.updateEdition('emerald-ape-042', '1-10', { available: 0 }))
    await expect(page.getByRole('radio', { name: 'Edição 1/10, esgotada' })).toBeVisible()
    await expect(page.getByText('Esta edição está esgotada. Escolha outra edição.')).toBeVisible()
  })
})
