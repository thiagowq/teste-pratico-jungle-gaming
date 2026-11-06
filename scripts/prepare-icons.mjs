// Prepara os ícones exportados do Figma (src/assets/icons) para uso como componentes.
//
// 1. Remove clipPaths do tamanho exato do ícone: não recortam nada, mas geram
//    ids repetidos na página quando o mesmo ícone aparece várias vezes.
// 2. Ícones de uma cor só passam a usar `currentColor`, com a cor original do
//    Figma preservada no atributo `color` da raiz: o visual padrão é idêntico ao
//    layout e estados (hover, ativo, desabilitado) podem recolorir via CSS.
//    Ícones multicoloridos (Google, botões mobile com fundo) ficam intactos.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('../src/assets/icons/', import.meta.url))

const SIZE = /<svg[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/
const FULL_CLIP = /<clipPath id="([^"]+)">\s*<rect width="([\d.]+)" height="([\d.]+)" fill="white"\/>\s*<\/clipPath>/

function stripRedundantClip(svg) {
  const size = svg.match(SIZE)
  const clip = svg.match(FULL_CLIP)
  if (!size || !clip || clip[2] !== size[1] || clip[3] !== size[2]) return svg
  return svg
    .replace(clip[0], '')
    .replaceAll(` clip-path="url(#${clip[1]})"`, '')
    .replace(/<defs>\s*<\/defs>\s*/, '')
}

function useCurrentColor(svg) {
  if (svg.includes('currentColor')) return svg
  const colors = [
    ...new Set([...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((match) => match[1].toUpperCase())),
  ]
  if (colors.length !== 1) return svg
  const [color] = colors
  return svg
    .replace(new RegExp(`(fill|stroke)="${color}"`, 'gi'), '$1="currentColor"')
    .replace('<svg ', `<svg color="${color}" `)
}

for (const file of readdirSync(dir).filter((name) => name.endsWith('.svg'))) {
  const path = join(dir, file)
  const original = readFileSync(path, 'utf8')
  const output = useCurrentColor(stripRedundantClip(original))
  if (output !== original) {
    writeFileSync(path, output)
    console.log(`${file}: atualizado`)
  }
}
