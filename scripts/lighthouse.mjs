// Auditoria Lighthouse do build otimizado com o cenário padrão dos mocks.
//
// - Páginas: início e detalhe do NFT.
// - Perfis: mobile (padrão do Lighthouse: Moto G Power, 4G lento, CPU 4×) e desktop.
// - 3 medições por página e perfil; o resumo usa a mediana de cada categoria.
// - Saída: lighthouse/reports/*.html|json, lighthouse/summary.json e lighthouse/summary.md.
//
// Uso: npm run build && npm run lighthouse
// Navegador: Google Chrome estável (LH_CHANNEL=chromium para o do Playwright, ou CHROME_PATH).
// O Lighthouse abre uma aba nova a cada medição (sem cache, sem service worker).
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { cpus, release, totalmem, type as osType } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { chromium } from '@playwright/test'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'lighthouse')
const PORT = 4180
const BASE = `http://localhost:${PORT}`
const RUNS = Number(process.env.LH_RUNS ?? 3)

const PAGES = [
  { id: 'inicio', path: '/' },
  { id: 'detalhe', path: '/nft/emerald-ape-042' },
]
const PROFILES = [
  { id: 'mobile', config: undefined },
  { id: 'desktop', config: desktopConfig },
]
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const METRICS = {
  lcp: 'largest-contentful-paint',
  cls: 'cumulative-layout-shift',
  tbt: 'total-blocking-time',
  fcp: 'first-contentful-paint',
  si: 'speed-index',
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Servidor de preview não respondeu em ${url}`)
}

mkdirSync(join(OUT, 'reports'), { recursive: true })

const preview = spawn(
  process.execPath,
  [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'],
  {
    cwd: ROOT,
    stdio: 'ignore',
  },
)

const DEBUG_PORT = 9333
let browser
try {
  await waitForServer(BASE)
  // Google Chrome estável (referência do Lighthouse), aberto pelo Playwright em headless.
  // LH_CHANNEL=chromium usa o Chromium do Playwright; CHROME_PATH aponta outro executável.
  browser = await chromium.launch({
    channel: process.env.CHROME_PATH ? undefined : (process.env.LH_CHANNEL ?? 'chrome'),
    executablePath: process.env.CHROME_PATH,
    args: [`--remote-debugging-port=${DEBUG_PORT}`],
  })
  const browserVersion = { Browser: `Chromium ${browser.version()}` }

  const results = []
  for (const page of PAGES) {
    for (const profile of PROFILES) {
      const runs = []
      for (let run = 1; run <= RUNS; run++) {
        // Cada medição em estado limpo: sem cache, sem service worker e sem storage.
        const result = await lighthouse(
          `${BASE}${page.path}`,
          { port: DEBUG_PORT, output: ['html', 'json'], logLevel: 'error', disableStorageReset: false },
          profile.config,
        )
        const name = `${page.id}-${profile.id}-${run}`
        writeFileSync(join(OUT, 'reports', `${name}.html`), result.report[0])
        writeFileSync(join(OUT, 'reports', `${name}.json`), result.report[1])
        const { lhr } = result
        runs.push({
          scores: Object.fromEntries(CATEGORIES.map((id) => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)])),
          metrics: Object.fromEntries(
            Object.entries(METRICS).map(([key, id]) => [key, lhr.audits[id]?.numericValue ?? 0]),
          ),
          // Valores medidos sem simulação de rede/CPU, úteis para separar o custo real do simulado.
          observed: {
            fcp: lhr.audits.metrics?.details?.items?.[0]?.observedFirstContentfulPaint ?? 0,
            lcp: lhr.audits.metrics?.details?.items?.[0]?.observedLargestContentfulPaint ?? 0,
          },
          lighthouseVersion: lhr.lighthouseVersion,
        })
        console.log(`${name}: ${CATEGORIES.map((id) => `${id} ${runs.at(-1).scores[id]}`).join(' · ')}`)
      }
      results.push({
        page: page.id,
        path: page.path,
        profile: profile.id,
        runs,
        median: {
          scores: Object.fromEntries(CATEGORIES.map((id) => [id, median(runs.map((r) => r.scores[id]))])),
          metrics: Object.fromEntries(
            Object.keys(METRICS).map((key) => [key, median(runs.map((r) => r.metrics[key]))]),
          ),
          observed: {
            fcp: median(runs.map((r) => r.observed.fcp)),
            lcp: median(runs.map((r) => r.observed.lcp)),
          },
        },
      })
    }
  }

  const environment = {
    date: new Date().toISOString(),
    lighthouse: results[0].runs[0].lighthouseVersion,
    browser: browserVersion.Browser,
    node: process.version,
    os: `${osType()} ${release()}`,
    cpu: `${cpus()[0]?.model} (${cpus().length} threads)`,
    memoryGb: Math.round(totalmem() / 1024 ** 3),
    runsPerPage: RUNS,
    server: 'vite preview (build de produção, mocks ligados, cenário padrão)',
  }
  writeFileSync(join(OUT, 'summary.json'), JSON.stringify({ environment, results }, null, 2))

  const ms = (value) => `${Math.round(value)} ms`
  const lines = [
    '# Lighthouse — mediana de 3 medições',
    '',
    `Lighthouse ${environment.lighthouse} · ${environment.browser} · Node ${environment.node} · ${environment.os}`,
    '',
    'LCP, CLS e TBT simulados (perfil padrão do Lighthouse); "LCP medido" é o valor sem simulação de rede e CPU.',
    '',
    '| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT | LCP medido |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...results.map(
      ({ page, profile, median: m }) =>
        `| ${page} | ${profile} | ${m.scores.performance} | ${m.scores.accessibility} | ${m.scores['best-practices']} | ${m.scores.seo} | ${ms(m.metrics.lcp)} | ${m.metrics.cls.toFixed(3)} | ${ms(m.metrics.tbt)} | ${ms(m.observed.lcp)} |`,
    ),
    '',
  ]
  writeFileSync(join(OUT, 'summary.md'), lines.join('\n'))
  console.log(`\n${lines.join('\n')}`)
} finally {
  await browser?.close()
  preview.kill()
}
