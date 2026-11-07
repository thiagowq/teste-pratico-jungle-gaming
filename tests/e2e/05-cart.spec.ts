import { USERS, expect, test, type App } from './fixtures'

async function total(app: App) {
  const summary = app.isMobile()
    ? app.page.getByRole('region', { name: 'Resumo da carteira' })
    : app.page.getByRole('complementary', { name: 'Resumo da carteira' })
  return (await summary.locator('dl').innerText()).replace(/\s+/g, ' ')
}

test.describe('5. Carrinho: quantidades, remoção, cupom e persistência', () => {
  test('altera quantidade, remove com desfazer e aplica cupons', async ({ app, page }) => {
    await app.start('/')
    await app.addToCartByApi([
      { nftId: 'emerald-ape-042', quantity: 2 },
      { nftId: 'violet-nomad-314', quantity: 6 },
      { nftId: 'ivory-baron-088', quantity: 9 },
    ])
    await app.goto('/carrinho')
    // Mesmos itens do Figma: 26.83 + 0.016 = 26.846 ETH.
    await expect.poll(() => total(app)).toContain('Total 26.846 ETH')

    await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
    await expect.poll(() => total(app)).toContain('Subtotal 28.02 ETH')

    await page.getByRole('button', { name: 'Remover Violet Nomad #314 do carrinho' }).click()
    const items = page.locator('li[aria-busy]')
    await expect(items.filter({ hasText: 'Violet Nomad #314' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Desfazer' }).click()
    await expect(items.filter({ hasText: 'Violet Nomad #314' })).toHaveCount(1)

    const coupon = page.getByLabel('Código promocional')
    const apply = page.getByRole('button', { name: 'Aplicar' })
    await coupon.fill('NAOEXISTE')
    await apply.click()
    await expect(page.getByText('Código promocional inválido.')).toBeVisible()
    await coupon.fill('boasvindas')
    await apply.click()
    await expect(page.getByText('Este código promocional expirou.')).toBeVisible()
    await coupon.fill('KURIO10')
    await apply.click()
    await expect.poll(() => total(app)).toContain('(-) 2.802 ETH')
    await page.getByRole('button', { name: 'Remover cupom' }).click()
    await expect.poll(() => total(app)).toContain('(-) 0.00')
  })

  test('carrinho do visitante persiste após refresh e é mantido ao entrar', async ({ app, page }) => {
    await app.start('/nft/golden-signal-160')
    await page.getByRole('button', { name: app.isMobile() ? 'Comprar NFT' : 'COMPRAR' }).click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await page.reload()
    await app.waitForMocks()
    await expect(page.getByText('Golden Signal #160').first()).toBeVisible()

    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/)
    await page.getByPlaceholder('contato@email.com').fill(USERS.bruno.email)
    await page.getByPlaceholder('Senha').fill(USERS.bruno.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/pagamento$/)
    // O item do visitante passou para a conta.
    await app.goto('/carrinho')
    await expect(page.locator('li[aria-busy]').filter({ hasText: 'Golden Signal #160' })).toHaveCount(1)
  })
})
