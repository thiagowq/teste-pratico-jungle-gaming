/**
 * Guarda apenas o token opaco da sessão (nunca senha). Persistido em
 * localStorage para sobreviver a refresh; outras abas são avisadas via evento
 * `storage`, o que permite reagir a logout/troca de usuário em paralelo.
 */
const STORAGE_KEY = 'nft.session-token'

type Listener = (token: string | null) => void
const listeners = new Set<Listener>()

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let current = read()

export function getSessionToken() {
  return current
}

export function setSessionToken(token: string | null) {
  if (token === current) return
  current = token
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Armazenamento indisponível (modo privado): a sessão vale só nesta aba.
  }
  listeners.forEach((listener) => listener(token))
}

export function subscribeSessionToken(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    current = event.newValue
    listeners.forEach((listener) => listener(current))
  })
}
