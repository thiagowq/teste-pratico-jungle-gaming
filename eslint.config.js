import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/routeTree.gen.ts', 'public/mockServiceWorker.js', 'playwright-report', 'test-results', 'lighthouse']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Rotas do TanStack Router exportam `Route`; componentes shadcn exportam variantes.
      'react-refresh/only-export-components': ['error', { allowConstantExport: true, allowExportNames: ['Route', 'buttonVariants', 'badgeVariants'] }],
    },
  },
  {
    // O plugin do TanStack Router faz o code splitting dos componentes de rota.
    files: ["src/routes/**/*.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
])
