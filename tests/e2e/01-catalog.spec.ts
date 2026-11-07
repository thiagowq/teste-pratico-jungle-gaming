import { expect, test, type App } from './fixtures'

/** No mobile e no tablet os filtros ficam numa gaveta; no desktop, na barra lateral. */
async function filters(app: App) {
  if (app.isMobile()) {
    await app.page.getByRole('button', { name: /Filtros e ordenação/ }).click()
    return app.page.getByRole('dialog')
  }
  return app.page.getByRole('complementary', { name: 'Filtros' })
}

const names = (app: App) => app.page.locator('#mercado article h3').allInnerTexts()

test.describe('1. Catálogo: busca, filtros, ordenação, paginação e histórico', () => {
  test('filtros combinados e ordenação vão para a URL e reiniciam a paginação', async ({ app, page }) => {
    await app.start('/?page=2')
    await expect(page.getByRole('button', { name: 'Página 2', exact: true })).toHaveAttribute('aria-current', 'page')

    const panel = await filters(app)
    await panel.getByRole('button', { name: /^Música/ }).click()
    await expect(page).toHaveURL(/categories=/)
    await expect(page).not.toHaveURL(/page=/)
    await panel.getByRole('button', { name: /^Ethereum/ }).click()
    await expect(page).toHaveURL(/networks=/)
    if (app.isMobile()) await page.getByRole('button', { name: /^Ver \d+ resultados/ }).click()

    const filtered = await names(app)
    expect(filtered.length).toBeGreaterThan(0)

    // Ordenação por menor preço: preços em ordem crescente.
    if (app.isMobile()) await page.getByRole('button', { name: /Filtros e ordenação/ }).click()
    await page.getByRole('combobox', { name: /Ordenar por/ }).click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    if (app.isMobile()) await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect(page.locator('#mercado')).not.toHaveAttribute('aria-busy', 'true')
    await expect
      .poll(async () => {
        const prices = (await page.locator('#mercado article p span.font-bold').allInnerTexts()).map((text) =>
          Number.parseFloat(text.replace(/[^\d.]/g, '')),
        )
        return prices.every((price, index) => index === 0 || prices[index - 1] <= price)
      })
      .toBe(true)
  })

  test('busca sem resultado mostra estado vazio e limpar restaura o catálogo', async ({ app, page }) => {
    await app.start('/?q=%22inexistente%22')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('button', { name: 'Limpar busca e filtros' }).click()
    await expect(page.locator('#mercado article')).toHaveCount(9)
  })

  test('paginação e voltar/avançar restauram o estado pela URL', async ({ app, page }) => {
    await app.start('/')
    const first = await names(app)
    await page.getByRole('button', { name: 'Página 3', exact: true }).click()
    await expect(page).toHaveURL(/page=3/)
    const third = await names(app)
    expect(third).not.toEqual(first)

    await page.getByRole('button', { name: 'Novos lançamentos' }).click()
    await expect(page).toHaveURL(/tab=new/)
    await expect(page).not.toHaveURL(/page=3/)

    await page.goBack()
    await expect(page).toHaveURL(/page=3/)
    await expect.poll(() => names(app)).toEqual(third)
    await page.reload()
    await app.waitForMocks()
    await expect.poll(() => names(app)).toEqual(third)
    await page.goForward()
    await expect(page).toHaveURL(/tab=new/)
  })

  test('navega do card para o detalhe', async ({ app, page }) => {
    await app.start('/')
    await page.getByRole('link', { name: 'Emerald Ape #042' }).first().click()
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })
})
