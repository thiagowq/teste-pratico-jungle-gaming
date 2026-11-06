// Gera as variantes responsivas das artes de NFT a partir dos originais do Figma.
// Origem: design-assets/nfts/*.png (exportados sem alteração, 1254×1254).
// Saída:  public/images/nfts/<nome>-<largura>.{avif,webp}
// Uso:    npm run images
import { mkdirSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import sharp from 'sharp'

export const NFT_IMAGE_WIDTHS = [160, 320, 480, 640, 960, 1254]

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const sourceDir = join(root, 'design-assets/nfts')
const outputDir = join(root, 'public/images/nfts')
mkdirSync(outputDir, { recursive: true })

for (const file of readdirSync(sourceDir).filter((name) => name.endsWith('.png'))) {
  const name = basename(file, '.png')
  const source = sharp(join(sourceDir, file))
  for (const width of NFT_IMAGE_WIDTHS) {
    const resized = source.clone().resize({ width, withoutEnlargement: true })
    await resized
      .clone()
      .avif({ quality: 55, effort: 6 })
      .toFile(join(outputDir, `${name}-${width}.avif`))
    await resized
      .clone()
      .webp({ quality: 78 })
      .toFile(join(outputDir, `${name}-${width}.webp`))
  }
  console.log(`${name}: ${NFT_IMAGE_WIDTHS.length * 2} variantes`)
}
