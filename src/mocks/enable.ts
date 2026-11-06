/**
 * Liga o MSW quando VITE_ENABLE_MOCKS=true (padrão em dev e no build de demonstração).
 * Importado dinamicamente para que o código de mocks não entre no bundle quando desligado.
 */
export async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const [{ worker }, { installMockControl }] = await Promise.all([import('./browser'), import('./control')])
  await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD })
  // Exposto só depois que o service worker controla a página: quem espera por
  // `window.__mocks` (testes, painel) já encontra as requisições interceptadas.
  installMockControl()
}
