import path from 'node:path'
import { USERS, expect, test } from './fixtures'

const AVATAR = path.join(import.meta.dirname, 'assets', 'avatar.png')

test.describe('8. Perfil, avatar, senha e carteiras com erros de validação', () => {
  test.beforeEach(async ({ app }) => {
    await app.start('/')
    await app.loginByApi(USERS.ana)
  })

  test('edita perfil com validação e conflito, e persiste', async ({ app, page }) => {
    await app.goto('/conta/perfil')
    await page.locator('#profile-displayName').fill('')
    await page.locator('#profile-ensName').fill('A!')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Informe o nome de exibição.')).toBeVisible()
    await expect(page.locator('#profile-displayName')).toBeFocused()
    await expect(page.locator('#profile-displayName')).toHaveAttribute('aria-invalid', 'true')

    await page.locator('#profile-displayName').fill('Ana K.')
    await page.locator('#profile-ensName').fill('ana-k')
    await page.locator('#profile-username').fill('bruno.eth')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Este nome de usuário já está em uso.')).toBeVisible()

    await page.locator('#profile-username').fill('ana.k')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Perfil atualizado.')).toBeVisible()
    await page.reload()
    await app.waitForMocks()
    await expect(page.locator('#profile-username')).toHaveValue('ana.k')
  })

  test('envia e remove avatar', async ({ app, page }) => {
    await app.goto('/conta/perfil')
    await page.locator('input[type=file]').setInputFiles(AVATAR)
    await expect(page.getByRole('img', { name: /Avatar de/ })).toBeVisible()
    await page.getByRole('button', { name: 'Remover', exact: true }).click()
    await expect(page.getByRole('img', { name: /Avatar de/ })).toHaveCount(0)
  })

  test('troca de senha valida a atual e passa a valer no login', async ({ app, page }) => {
    await app.goto('/conta/perfil')
    await page.locator('#profile-currentPassword').fill('errada')
    await page.locator('#profile-newPassword').fill('fraca')
    await page.locator('#profile-confirmPassword').fill('outra')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText(/A senha precisa de 8\+ caracteres/)).toBeVisible()
    await expect(page.getByText('As senhas não coincidem.')).toBeVisible()

    await page.locator('#profile-newPassword').fill('NovaSenha9')
    await page.locator('#profile-confirmPassword').fill('NovaSenha9')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()

    await page.locator('#profile-currentPassword').fill(USERS.ana.password)
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Perfil e senha atualizados.')).toBeVisible()

    const status = await page.evaluate(
      async ([email, password]) =>
        (
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
        ).status,
      [USERS.ana.email, 'NovaSenha9'],
    )
    expect(status).toBe(200)
  })

  test('carteiras: endereço inválido, conflito e secundária salva', async ({ app, page }) => {
    await app.goto('/conta/carteiras')
    await page.locator('#wallet-primary-address').fill('0x123')
    await page.getByRole('button', { name: 'Salvar carteira' }).first().click()
    await expect(page.getByText('Endereço inválido: use 0x seguido de 40 caracteres hexadecimais.')).toBeVisible()
    await page.locator('#wallet-primary-address').fill('0xA91F3c2B7d4E5f60718293a4b5C6d7E8f9a0E82C')

    await page.getByRole('button', { name: 'Remover carteira secundária' }).click()
    await page.getByText('Igual à carteira principal').click()
    await page.getByRole('button', { name: 'Adicionar' }).click()
    await page.locator('#wallet-secondary-address').fill('0xA91F3c2B7d4E5f60718293a4b5C6d7E8f9a0E82C')
    await page.getByRole('button', { name: 'Salvar carteira' }).last().click()
    await expect(page.locator('#wallet-secondary-address-error')).toHaveText(
      'Este endereço já está cadastrado na outra carteira.',
    )

    await page.locator('#wallet-secondary-network').selectOption('solana')
    await page.locator('#wallet-secondary-address').fill('7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2')
    await page.getByRole('button', { name: 'Salvar carteira' }).last().click()
    await expect(page.getByText('Carteira secundária salva.')).toBeVisible()
    await page.reload()
    await app.waitForMocks()
    await expect(page.locator('#wallet-secondary-network')).toHaveValue('solana')
  })
})
