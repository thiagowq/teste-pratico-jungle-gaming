/**
 * Identificador do carrinho do visitante. Gerado no primeiro acesso e enviado
 * no header `X-Guest-Cart` enquanto não há sessão; no login o servidor mescla
 * esse carrinho ao da conta e o identificador é descartado.
 */
const STORAGE_KEY = 'nft.guest-cart-id'

export function getGuestCartId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return 'guest-volatile'
  }
}

export function resetGuestCartId() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignora
  }
}
