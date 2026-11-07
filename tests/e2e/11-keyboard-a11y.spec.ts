import AxeBuilder from '@axe-core/playwright'
import { USERS, expect, test } from './fixtures'

test.describe('11. Teclado, foco em diálogos e validação acessível', () => {
  test('pular para o conteúdo e foco visível por teclado', async ({ app, page }) => {
    await app.start('/')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeAttached()
    await page.keyboard.press('Tab')
    await expect(skip).toBeFocused()
    const outline = await skip.evaluate((element) => getComputedStyle(element).outlineStyle)
    expect(outline).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#conteudo$/)
  })

  test('diálogo de login prende o foco e fecha com Esc', async ({ app, page }) => {
    test.skip(app.isMobile(), 'No mobile o login é uma página, não um diálogo.')
    await app.start('/')
    await page.getByRole('link', { name: 'Entrar' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // O foco permanece dentro do diálogo ao percorrer com Tab.
    for (let step = 0; step < 12; step++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/$/)
  })

  test('erros de formulário ficam associados aos campos', async ({ app, page }) => {
    await app.start('/entrar')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    const email = page.getByPlaceholder('contato@email.com')
    await expect(email).toBeFocused()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription('Informe um e-mail válido.')
  })

  test('filtros e paginação operáveis só com teclado', async ({ app, page }) => {
    test.skip(app.isMobile(), 'Fluxo de barra lateral do desktop.')
    await app.start('/')
    await page.getByRole('button', { name: /^Arte digital/ }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/categories=/)
    await page.getByRole('button', { name: 'Página 2', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/page=2/)
  })

  test('páginas principais sem violações graves de acessibilidade (axe)', async ({ app, page }) => {
    await app.start('/')
    await app.loginByApi(USERS.ana)
    await app.addToCartByApi([{ nftId: 'emerald-ape-042', quantity: 1 }])
    for (const path of ['/', '/nft/emerald-ape-042', '/carrinho', '/pagamento']) {
      await app.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
      expect(serious.map((violation) => `${path}: ${violation.id} (${violation.nodes.length})`)).toEqual([])
    }
  })
})
