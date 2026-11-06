/**
 * Liga o MSW quando VITE_ENABLE_MOCKS=true (padrão em dev e no build de demonstração).
 * Importado dinamicamente para que o código de mocks não entre no bundle quando desligado.
 */
export async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { worker } = await import('./browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD })
}
