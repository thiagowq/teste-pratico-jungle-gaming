import { enableMocking } from '@/mocks/enable'
import './index.css'

// O MSW e a aplicação são baixados em paralelo; a montagem (que dispara as
// requisições) espera o service worker assumir. O cliente Socket.IO é carregado
// só na primeira conexão, depois do MSW já ter substituído o `WebSocket`.
Promise.all([enableMocking(), import('./app')]).then(([, { mountApp }]) => mountApp(document.getElementById('root')!))
