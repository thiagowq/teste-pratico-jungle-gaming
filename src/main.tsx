import { enableMocking } from '@/mocks/enable'
import './index.css'

// A aplicação é importada só depois do MSW: o engine.io-client captura o
// construtor `WebSocket` ao carregar, e o MSW precisa tê-lo substituído antes.
enableMocking()
  .then(() => import('./app'))
  .then(({ mountApp }) => mountApp(document.getElementById('root')!))
