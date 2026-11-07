import { expect, test } from './fixtures'

test.describe('Painel de cenários da demonstração', () => {
  test('troca o cenário e dispara evento de preço no NFT aberto', async ({ app, page }) => {
    await app.start('/nft/golden-beat-207')
    await expect(page.getByTestId('nft-price')).toContainText('0.99 ETH')
    await app.waitForRealtime()

    await page.getByRole('button', { name: 'Abrir painel de cenários da demonstração' }).click()
    const panel = page.getByRole('dialog', { name: 'Cenários da demonstração' })
    await panel.getByRole('radio', { name: /Rede lenta/ }).click()
    await expect(panel.getByRole('radio', { name: /Rede lenta/ })).toHaveAttribute('aria-checked', 'true')
    expect(await page.evaluate(() => window.__mocks!.scenario().name)).toBe('slow')

    await panel.getByRole('radio', { name: /Instantâneo/ }).click()
    await expect(panel).toContainText('Golden Beat #207 · 0.99 ETH')
    await panel.getByRole('button', { name: 'Preço +10%' }).click()
    await expect(page.getByTestId('nft-price')).toContainText('1.089 ETH')
  })
})
