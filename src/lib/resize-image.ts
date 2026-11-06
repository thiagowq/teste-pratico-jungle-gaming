const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']
const MAX_FILE_BYTES = 5 * 1024 * 1024

export const AVATAR_ACCEPT = ACCEPTED.join(',')

/**
 * Prepara o avatar no navegador: valida tipo e tamanho e recorta em quadrado
 * de 256px (WebP). Reduz o envio de megabytes para dezenas de kilobytes.
 */
export async function prepareAvatar(file: File, size = 256): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new Error('Use uma imagem PNG, JPEG ou WebP.')
  if (file.size > MAX_FILE_BYTES) throw new Error('A imagem precisa ter até 5 MB.')

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Não foi possível ler esta imagem.')
  })
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Seu navegador não conseguiu processar a imagem.')
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.85)
}
