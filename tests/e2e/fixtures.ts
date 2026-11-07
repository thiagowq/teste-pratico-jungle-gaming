import { test as base, expect, type Page } from '@playwright/test'

export const USERS = {
  ana: { email: 'colecionador@kurio.test', password: 'Kurio@2026', id: 'user-ana', name: 'Ana Colecionadora' },
  bruno: { email: 'segundo@kurio.test', password: 'Kurio@2027', id: 'user-bruno', name: 'Bruno Cripto' },
} as const

export const ANA_WALLET = '0xA91F3c2B7d4E5f60718293a4b5C6d7E8f9a0E82C'

type Scenario =
  | 'default'
  | 'instant'
  | 'slow'
  | 'variable-latency'
  | 'offline'
  | 'server-error'
  | 'empty-catalog'
  | 'payment-declined'
  | 'wallet-rejects'
  | 'order-timeout'

/**
 * Ações sobre a aplicação e a camada de mocks (window.__mocks). As requisições
 * da aplicação passam pelos handlers MSW; nada aqui altera a UI diretamente.
 */
export class App {
  constructor(readonly page: Page) {}

  async waitForMocks() {
    await this.page.waitForFunction(() => Boolean(window.__mocks), null, { timeout: 20_000 })
  }

  /** Espera o cliente Socket.IO conectar (carregado sob demanda após a primeira renderização). */
  async waitForRealtime() {
    await this.page.waitForFunction(() => (window.__mocks?.socketConnections() ?? 0) > 0, null, { timeout: 20_000 })
  }

  /** Estado isolado: banco simulado restaurado e cenário escolhido antes de abrir a rota. */
  async start(path = '/', scenario: Scenario = 'instant') {
    await this.page.goto('/em-breve/inicio')
    await this.waitForMocks()
    await this.page.evaluate((name) => {
      localStorage.clear()
      sessionStorage.clear()
      window.__mocks!.reset()
      window.__mocks!.setScenario(name)
    }, scenario)
    await this.goto(path)
  }

  async goto(path: string) {
    await this.page.goto(path)
    await this.waitForMocks()
  }

  /** Autentica pela API simulada (atalho para testes que não cobrem o login). */
  async loginByApi(user: { email: string; password: string }) {
    await this.page.evaluate(async ({ email, password }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await response.json()
      localStorage.setItem('nft.session-token', body.session.token)
    }, user)
  }

  /** Adiciona itens ao carrinho pela API (do usuário logado ou do visitante). */
  async addToCartByApi(items: Array<{ nftId: string; editionId?: string; quantity: number }>) {
    await this.page.evaluate(async (lines) => {
      const token = localStorage.getItem('nft.session-token')
      let guest = localStorage.getItem('nft.guest-cart-id')
      if (!token && !guest) {
        guest = crypto.randomUUID()
        localStorage.setItem('nft.guest-cart-id', guest)
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      else headers['X-Guest-Cart'] = guest!
      for (const line of lines) {
        await fetch('/api/cart/items', {
          method: 'POST',
          headers,
          body: JSON.stringify({ editionId: '1-50', ...line }),
        })
      }
    }, items)
  }

  /** Quantidade de pedidos criados no banco simulado (para provar ausência de duplicatas). */
  ordersCount() {
    return this.page.evaluate(
      () => Object.keys(JSON.parse(localStorage.getItem('nft-mock:db:v4') ?? '{"orders":{}}').orders).length,
    )
  }

  isMobile() {
    return (this.page.viewportSize()?.width ?? 1440) < 768
  }
}

/** Do pagamento até o diálogo de revisão: conecta a MetaMask e pede a cotação. */
export async function reachReview(app: App) {
  const { page } = app
  await page.getByRole('radio', { name: 'MetaMask', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: /Conectada/ })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('dialog', { name: 'Revise seu pedido' })).toBeVisible()
}

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    await use(new App(page))
  },
})

export { expect }
