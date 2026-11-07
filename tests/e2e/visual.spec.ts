import { USERS, expect, test, type App } from './fixtures'

/** Página pronta para captura: fontes, imagens decodificadas e nenhum aviso flutuante. */
async function settle(app: App) {
  const { page } = app
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((image) => (image.loading = 'eager'))
    await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))
  })
  // Avisos flutuantes não fazem parte da baseline.
  await page.addStyleTag({ content: '[data-sonner-toaster] { display: none !important; }' })
}

test.describe('Regressão visual (dados estáveis do cenário padrão)', () => {
  test('início', async ({ app, page }) => {
    await app.start('/')
    await settle(app)
    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
  })

  test('detalhe', async ({ app, page }) => {
    await app.start('/nft/emerald-ape-042')
    await settle(app)
    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
  })

  test('carrinho', async ({ app, page }) => {
    await app.start('/')
    await app.addToCartByApi([
      { nftId: 'emerald-ape-042', quantity: 2 },
      { nftId: 'violet-nomad-314', quantity: 6 },
      { nftId: 'ivory-baron-088', quantity: 9 },
    ])
    await app.goto('/carrinho')
    await settle(app)
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
  })

  test('pagamento', async ({ app, page }) => {
    await app.start('/')
    await app.loginByApi(USERS.ana)
    await app.addToCartByApi([
      { nftId: 'emerald-ape-042', quantity: 2 },
      { nftId: 'violet-nomad-314', quantity: 6 },
      { nftId: 'ivory-baron-088', quantity: 9 },
    ])
    await app.goto('/pagamento')
    await settle(app)
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
  })
})
