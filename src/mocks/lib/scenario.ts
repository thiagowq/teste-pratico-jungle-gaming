import type { ApiErrorCode } from '@/api/errors'

/**
 * Cenários de rede e falha dos mocks. Configuráveis por:
 *  - query string `?mock-scenario=<nome>` (persistida para os próximos carregamentos);
 *  - `window.__mocks` (usado pelos testes Playwright e pelo painel de desenvolvimento).
 */
export type NetworkProfile = 'instant' | 'normal' | 'slow' | 'variable'

export type Fault =
  { kind: 'http'; status: number; code: ApiErrorCode; message?: string } | { kind: 'timeout' } | { kind: 'offline' }

export interface FaultRule {
  fault: Fault
  /** Quantas vezes a falha acontece antes de a rota voltar ao normal. Omitido = sempre. */
  times?: number
}

export interface ScenarioConfig {
  name: string
  network: NetworkProfile
  seed: number
  /** Falhas por rota, chaveadas pelo identificador da rota (ex.: `GET /nfts`). `*` vale para todas. */
  faults: Record<string, FaultRule>
  /** Sinalizadores de dados interpretados pelos handlers de domínio. */
  flags: Record<string, boolean>
}

type Preset = Omit<ScenarioConfig, 'name' | 'seed'>

export const SCENARIO_PRESETS: Record<string, Preset> = {
  default: { network: 'normal', faults: {}, flags: {} },
  instant: { network: 'instant', faults: {}, flags: {} },
  slow: { network: 'slow', faults: {}, flags: {} },
  'variable-latency': { network: 'variable', faults: {}, flags: {} },
  offline: { network: 'normal', faults: { '*': { fault: { kind: 'offline' } } }, flags: {} },
  'server-error': {
    network: 'normal',
    faults: { '*': { fault: { kind: 'http', status: 503, code: 'TRANSIENT' } } },
    flags: {},
  },
  'empty-catalog': { network: 'normal', faults: {}, flags: { emptyCatalog: true } },
}

const STORAGE_KEY = 'nft-mock:scenario'
const DEFAULT_SEED = 20261106

function presetConfig(name: string): ScenarioConfig {
  const known = Object.hasOwn(SCENARIO_PRESETS, name)
  const preset = SCENARIO_PRESETS[known ? name : 'default']
  return { name: known ? name : 'default', seed: DEFAULT_SEED, ...structuredClone(preset) }
}

function loadInitial(): ScenarioConfig {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('mock-scenario')
    if (fromUrl) return presetConfig(fromUrl)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as ScenarioConfig
  } catch {
    // Configuração corrompida ou indisponível: usa o padrão.
  }
  return presetConfig('default')
}

let config = loadInitial()
persist()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // ignora
  }
}

export function getScenario(): Readonly<ScenarioConfig> {
  return config
}

export function setScenario(name: string) {
  config = presetConfig(name)
  persist()
}

export function updateScenario(patch: Partial<Omit<ScenarioConfig, 'name'>>) {
  config = { ...config, ...patch, name: 'custom' }
  persist()
}

export function setFault(route: string, rule: FaultRule | null) {
  const faults = { ...config.faults }
  if (rule) faults[route] = rule
  else delete faults[route]
  config = { ...config, faults }
  persist()
}

/** Retorna e consome a falha configurada para a rota, se houver. */
export function takeFault(route: string): Fault | null {
  const key = route in config.faults ? route : '*' in config.faults ? '*' : null
  if (!key) return null
  const rule = config.faults[key]
  if (rule.times !== undefined) {
    const remaining = rule.times - 1
    setFault(key, remaining > 0 ? { ...rule, times: remaining } : null)
  }
  return rule.fault
}

export function hasFlag(flag: string) {
  return config.flags[flag] === true
}
