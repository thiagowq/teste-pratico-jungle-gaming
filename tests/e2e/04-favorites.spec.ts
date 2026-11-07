import { USERS, expect, test } from './fixtures'

test.describe('4. Favoritos: persistência, falha de mutation e recuperação', () => {
  test('favorito persiste para o usuário e sobrevive a refresh', async ({ app, page }) => {
    await app.start('/')
    await app.loginByApi(USERS.ana)
    await app.goto('/nft/emerald-ape-042')
    const favorite = page.getByRole('button', { name: /Favoritar Emerald Ape #042|Remover Emerald Ape #042/ }).first()
    await expect(favorite).toHaveAttribute('aria-pressed', 'false')
    await favorite.click()
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')
    await page.reload()
    await app.waitForMocks()
    await expect(page.getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' }).first()).toBeVisible()
  })

  test('falha da API desfaz a atualização otimista e permite tentar de novo', async ({ app, page }) => {
    await app.start('/')
    await app.loginByApi(USERS.ana)
    await app.goto('/nft/golden-beat-207')
    await expect(page.getByRole('button', { name: 'Favoritar Golden Beat #207' }).first()).toBeVisible()
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => {
      window.__mocks!.updateScenario({ network: 'slow' })
      window.__mocks!.setFault('PUT /favorites/:nftId', {
        fault: { kind: 'http', status: 500, code: 'TRANSIENT' },
        times: 1,
      })
    })
    // O rótulo muda (Favoritar ↔ Remover); o seletor cobre os dois estados.
    const target = page.getByRole('button', { name: /(Favoritar|Remover) Golden Beat #207/ }).first()

    await target.click()
    // Otimista: muda antes da resposta.
    await expect(target).toHaveAttribute('aria-pressed', 'true')
    // Falha: volta ao estado anterior e avisa.
    await expect(target).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 })
    await expect(page.getByText(/Não foi possível atualizar o favorito/)).toBeVisible()

    await page.evaluate(() => window.__mocks!.updateScenario({ network: 'instant' }))
    await target.click()
    await expect(target).toHaveAttribute('aria-pressed', 'true')
    await app.goto('/conta/favoritos')
    await expect(page.locator('main article h3')).toContainText(['Golden Beat #207'])
  })

  test('visitante é levado ao login ao favoritar', async ({ app, page }) => {
    await app.start('/nft/sage-nomad-009')
    await page.getByRole('button', { name: 'Favoritar Sage Nomad #009' }).first().click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fnft%2Fsage-nomad-009/)
  })
})
