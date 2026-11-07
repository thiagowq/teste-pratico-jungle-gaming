/**
 * Só aceita destinos internos ("/carrinho", "/nft/x?edicao=1-1"); qualquer
 * outra coisa (URL absoluta, "//host", rotas de auth) volta para o início.
 */
export function safeRedirect(target: string | undefined) {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return '/'
  if (/^\/(entrar|cadastro)(\/|\?|$)/.test(target)) return '/'
  return target
}
