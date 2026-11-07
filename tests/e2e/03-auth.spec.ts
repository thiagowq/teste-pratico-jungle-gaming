import { USERS, expect, test } from './fixtures'

test.describe('3. Conta: cadastro, login, expiração, logout e troca de usuário', () => {
  test('cadastro valida campos, trata conflito e entra na conta', async ({ app, page }) => {
    await app.start('/cadastro')
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(page.getByText('O nome de usuário precisa de pelo menos 3 caracteres.')).toBeVisible()
    await expect(page.getByPlaceholder('Nome de usuário')).toBeFocused()

    await page.getByPlaceholder('Nome de usuário').fill('ana.kurio')
    await page.getByPlaceholder('Digite seu e-mail', { exact: true }).fill(USERS.ana.email)
    await page.getByPlaceholder('Senha', { exact: true }).fill('Segura123')
    await page.getByPlaceholder('Confirmar senha').fill('Segura123')
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(page.getByText('Este nome de usuário já está em uso.')).toBeVisible()
    await expect(page.getByText('Este e-mail já está cadastrado. Entre ou use outro e-mail.')).toBeVisible()

    await page.getByPlaceholder('Nome de usuário').fill('nova.pessoa')
    await page.getByPlaceholder('Digite seu e-mail', { exact: true }).fill('nova@kurio.test')
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/conta/perfil')
    await expect(page.locator('#profile-username')).toHaveValue('nova.pessoa')
  })

  test('login com erro, sucesso e retorno ao fluxo anterior', async ({ app, page }) => {
    await app.start('/conta/carteiras')
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fconta%2Fcarteiras/)

    await page.getByPlaceholder('contato@email.com').fill(USERS.ana.email)
    await page.getByPlaceholder('Senha').fill('senha-errada')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()

    await page.getByPlaceholder('Senha').fill(USERS.ana.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/conta\/carteiras$/)
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  })

  test('sessão expirada durante a navegação leva ao login preservando o destino', async ({ app, page }) => {
    await app.start('/')
    await app.loginByApi(USERS.ana)
    await app.goto('/conta/perfil')
    await expect(page.locator('#profile-displayName')).toHaveValue(USERS.ana.name)

    await page.evaluate(() => window.__mocks!.expireSessions())
    await page.getByRole('link', { name: 'Carteiras' }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=/)
    await expect(page.getByText(/Sua sessão expirou/).first()).toBeVisible()
  })

  test('logout e troca de usuário limpam dados privados', async ({ app, page }) => {
    await app.start('/')
    await app.loginByApi(USERS.ana)
    await app.goto('/conta/favoritos')
    await expect(page.locator('main article h3')).toHaveText(['Sage Nomad #009'])

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)
    expect(await page.evaluate(() => localStorage.getItem('nft.session-token'))).toBeNull()

    await app.goto('/entrar?redirect=%2Fconta%2Ffavoritos')
    await page.getByPlaceholder('contato@email.com').fill(USERS.bruno.email)
    await page.getByPlaceholder('Senha').fill(USERS.bruno.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/conta\/favoritos$/)
    await expect(page.getByText('Nenhum favorito ainda')).toBeVisible()
  })
})
