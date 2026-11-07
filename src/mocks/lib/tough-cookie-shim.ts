/**
 * Substituto mínimo do `tough-cookie` para o bundle do MSW (alias em vite.config.ts).
 *
 * O MSW usa o `tough-cookie` só no seu cookie store, que guarda cookies definidos
 * por respostas mockadas (`Set-Cookie`). Esta API mockada não usa cookies (a sessão
 * vai no cabeçalho `Authorization`), e o pacote original traz a lista de sufixos
 * públicos (`tldts`), cerca de 260 KB que atrasavam a primeira renderização.
 *
 * Contrato mantido: nenhum cookie é armazenado e `getCookiesSync` devolve lista vazia.
 */
export class Cookie {
  key = ''
  value = ''
  domain: string | null = null
  path: string | null = null

  static fromJSON(): Cookie | null {
    return null
  }

  toJSON() {
    return {}
  }

  toString() {
    return ''
  }
}

export class MemoryCookieStore {
  idx: Record<string, Record<string, Record<string, Cookie>>> = {}
}

export class CookieJar {
  getCookiesSync(): Cookie[] {
    return []
  }

  async setCookie(): Promise<void> {}
}
