import { expect, test } from './fixtures'

test.describe('2. Detalhe: acesso direto e recurso inexistente', () => {
  test('acesso direto carrega o NFT com edição da URL e limite de quantidade', async ({ app, page }) => {
    await app.start('/nft/emerald-ape-042?edicao=1-10')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Edição 1\/10/ })).toHaveAttribute('aria-checked', 'true')

    const increase = page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' })
    for (let step = 0; step < 10 && (await increase.isEnabled()); step++) await increase.click()
    await expect(increase).toBeDisabled()
    await expect(page.getByLabel(/^Quantidade: \d+$/)).toHaveText('5')
  })

  test('edição esgotada não pode ser comprada', async ({ app, page }) => {
    await app.start('/nft/cosmic-bloom-118?edicao=1-10')
    await expect(page.getByRole('radio', { name: /Edição 1\/10, esgotada/ })).toBeVisible()
    await expect(page.getByText('Esta edição está esgotada. Escolha outra edição.')).toBeVisible()
  })

  test('NFT inexistente mostra página própria', async ({ app, page }) => {
    await app.start('/nft/nao-existe-999')
    await expect(page.getByRole('heading', { name: 'Não encontramos este NFT' })).toBeVisible()
    await page.getByRole('link', { name: 'Explorar o mercado' }).click()
    await expect(page).toHaveURL(/\/#mercado$/)
  })

  test('rota inexistente mostra 404', async ({ app, page }) => {
    await app.start('/rota/que/nao/existe')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })
})
