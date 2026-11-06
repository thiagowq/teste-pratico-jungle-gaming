// Prepara os ícones exportados do Figma (src/assets/icons) para uso como componentes.
// Ícones de uma cor só passam a usar `currentColor`, com a cor original do Figma
// preservada no atributo `color` da raiz: o visual padrão é idêntico ao layout e
// estados (hover, ativo, desabilitado) podem recolorir via CSS.
// Ícones multicoloridos (Google, botões mobile com fundo) ficam intactos.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = new URL('../src/assets/icons/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

for (const file of readdirSync(dir).filter((name) => name.endsWith('.svg'))) {
  const path = join(dir, file)
  const svg = readFileSync(path, 'utf8')
  if (svg.includes('currentColor')) continue
  const colors = [...new Set([...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1].toUpperCase()))]
  if (colors.length !== 1) continue
  const [color] = colors
  const pattern = new RegExp(`(fill|stroke)="${color}"`, 'gi')
  const output = svg.replace(pattern, '$1="currentColor"').replace('<svg ', `<svg color="${color}" `)
  writeFileSync(path, output)
  console.log(`${file}: ${color} → currentColor`)
}
