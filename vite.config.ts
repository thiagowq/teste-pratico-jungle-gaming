import path from 'node:path'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    svgr(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // O cookie store do MSW não é usado por esta API (sessão via Authorization) e o
      // pacote original pesa ~260 KB por causa da lista de sufixos públicos.
      'tough-cookie': path.resolve(import.meta.dirname, './src/mocks/lib/tough-cookie-shim.ts'),
    },
  },
  optimizeDeps: {
    // Pré-otimiza o que é carregado sob demanda (após o MSW iniciar), evitando
    // reotimização no meio da sessão, que gera cópias duplicadas do React.
    include: [
      'react',
      'react-dom/client',
      'react/compiler-runtime',
      '@tanstack/react-router',
      '@tanstack/react-query',
      'axios',
      'socket.io-client',
      'msw',
      'msw/browser',
      '@mswjs/socket.io-binding',
    ],
  },
})
