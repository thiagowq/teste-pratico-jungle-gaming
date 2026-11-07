# Arquitetura

Este documento explica como a aplicação se organiza e por que as principais decisões foram tomadas. Setup, credenciais e cenários estão no [README](README.md).

## Visão geral

```text
UI (rotas e features)
  │  useQuery / useMutation
  ▼
TanStack Query (cache) ◄─── realtime/sync.ts ◄── realtime/socket.ts (Socket.IO)
  │                                                   │
  ▼                                                   │
api/* (Axios + zod) ── REST ──► MSW (handlers) ◄──────┘ ws.link (Socket.IO)
                                   │
                                   ▼
                     banco simulado (localStorage)
```

O sistema tem três camadas, com a mesma separação que existiria com um backend real.

- **`src/api`**: único ponto que fala HTTP.
  - Cada recurso tem um módulo (`catalog`, `cart`, `checkout`…) que chama o Axios e valida a resposta com zod.
  - Resposta fora do contrato vira `ApiError` com código `UNKNOWN`, em vez de dado corrompido no cache.
- **`src/features`**: hooks de consulta e mutação (TanStack Query) e os componentes de cada funcionalidade. As rotas em `src/routes` só compõem as features.
- **`src/mocks`**: a "API". Os handlers do MSW implementam as regras de negócio (estoque, cotação, idempotência, liquidação) sobre um banco em `localStorage`. A aplicação não importa nada dos mocks; só o painel de demonstração usa `window.__mocks`.

Com `VITE_ENABLE_MOCKS=false`, os mocks não entram no bundle. A aplicação passa a chamar `VITE_API_URL` e `VITE_SOCKET_URL` sem nenhuma outra mudança.

## Contratos REST

Os esquemas ficam em `src/api/contracts/*.ts`, e os tipos TypeScript são inferidos deles (`z.infer`).

Valores em ETH trafegam como **string decimal** (`"1.19"`), nunca como `number`. As contas no cliente (resumo do carrinho, filtros de preço) usam `decimal.js`, o que evita erros de ponto flutuante como `0.1 + 0.2`.

| Recurso      | Endpoints                                                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Autenticação | `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout`                                                                            |
| Catálogo     | `GET /nfts?q&categories&networks&minPrice&maxPrice&tab&sort&page`, `GET /nfts/featured`, `GET /nfts/:id`                                                       |
| Favoritos    | `GET /favorites`, `PUT /favorites/:nftId`, `DELETE /favorites/:nftId`                                                                                          |
| Carrinho     | `GET /cart`, `POST /cart/items`, `PATCH`/`DELETE /cart/items/:nftId/:editionId`, `POST /cart/merge`, `POST`/`DELETE /cart/coupon`, `POST /cart/accept-changes` |
| Carteiras    | `GET /wallets`, `PUT`/`DELETE /wallets/:slot`, `POST /wallets/connect`, `POST /wallets/disconnect`                                                             |
| Checkout     | `POST /checkout/quote`, `POST /orders` (com `Idempotency-Key`), `GET /orders`, `GET /orders/:id`                                                               |
| Perfil       | `GET`/`PATCH /me/profile`, `PUT`/`DELETE /me/avatar`, `POST /me/password`                                                                                      |

### Erros

Todo erro segue o formato `{ error: { code, message, fields?, details? } }`. O cliente o normaliza em `ApiError` (`src/api/errors.ts`):

- **Códigos de negócio**:
  - `VALIDATION_ERROR` traz `fields`, que os formulários mostram campo a campo;
  - `OUT_OF_STOCK`, `PRICE_CHANGED`, `QUOTE_EXPIRED`, `COUPON_INVALID`, `COUPON_EXPIRED`, `IDEMPOTENCY_CONFLICT`, `PAYMENT_DECLINED` e `WALLET_REJECTED`.
- **Sessão**: `UNAUTHENTICATED` e `SESSION_EXPIRED` encerram a sessão local (ver abaixo).
- **Transitórios**: `TRANSIENT` (5xx), `NETWORK` e `TIMEOUT` são os únicos que admitem nova tentativa (`isRetryable`).

## Contrato de eventos (Socket.IO)

A conexão usa `path: '/realtime/'`, só o transporte WebSocket e o token da sessão na query. Visitantes também conectam e recebem eventos públicos.

Todo evento usa o mesmo envelope (`src/realtime/events.ts`):

```ts
{
  id: string // identidade estável: duplicatas são descartadas
  type: 'nft.updated' | 'order.updated'
  resource: {
    type: 'nft' | 'order'
    id: string
  }
  version: number // versão do recurso após a mudança
  occurredAt: string // ISO 8601
  data: NftUpdatedData | OrderUpdatedData
}
```

- **`nft.updated`**: `data.editions[]` com `id`, `priceEth` e `available`. É público e vai para todos os clientes.
- **`order.updated`**: `data.status` (`pending`, `confirmed` ou `declined`), mais `txHash` ou `reason`. Vai só para o dono do pedido.

## Reconciliação entre REST e Socket.IO

O REST é a fonte da verdade, e os eventos são atalhos para atualizar a tela sem esperar uma nova consulta.

1. **Versões monotônicas**: cada NFT e cada pedido têm `version`, que a API incrementa a cada mudança.
2. **`EventGate`** (`src/realtime/event-gate.ts`): descarta eventos com `id` já visto e eventos com `version` menor ou igual à última conhecida do recurso.
   - As versões vindas do REST também são registradas (`realtime.observeVersion`). Assim, um evento atrasado nunca sobrescreve uma resposta REST mais nova.
3. **Aplicação no cache** (`src/realtime/sync.ts`):
   - o detalhe do NFT recebe o patch direto (`setQueryData`, só se `event.version` for maior que a versão em cache);
   - listagens e carrinho são invalidados, porque dependem de valores calculados pelo servidor (subtotal, pendências do carrinho);
   - um aviso descreve só o que importa para quem está olhando, como o preço de um item do carrinho ou a edição aberta que esgotou.
4. **Reconexão**: eventos emitidos com o socket fora do ar se perdem. Ao reconectar, todas as consultas ativas são invalidadas e a tela volta a refletir a API.
   - Um indicador mostra "Reconectando ao tempo real…".
   - O cliente desiste de uma tentativa em 5 s, com espera máxima de 3 s entre tentativas.
5. **Checkout**: se chega um `nft.updated` de um item com a revisão aberta, a cotação é refeita. Quando o total muda, o botão exige nova confirmação.
6. **Pedido pendente**: a confirmação acompanha o pedido por evento (`order.updated`) e, por segurança, por polling de 3 s enquanto ele está `pending`. A tela sobrevive a refresh e a queda do socket.

O `socket.io-client` é importado sob demanda na primeira conexão, depois da renderização inicial. Por isso a primeira conexão abre logo após a carga da página, e não junto com ela.

## Política de sessão

- **Token**:
  - opaco, devolvido no login ou no cadastro;
  - guardado em `localStorage` (`nft.session-token`) e enviado como `Authorization: Bearer`;
  - expira em 30 minutos no servidor simulado.
- **Estado da sessão**: `GET /auth/session` é a consulta `['session', token]`. Ela não tenta de novo em erros de autenticação.
- **Expiração**: qualquer 401 (`SESSION_EXPIRED` ou `UNAUTHENTICATED`) dispara `onAuthFailure`. Em seguida:
  1. o token é apagado;
  2. o cache privado é removido;
  3. o socket reconecta como visitante.

  Em página privada, o layout `_auth` leva ao login com `redirect` para a página atual. Em página pública, um aviso informa que a sessão expirou.

- **Rotas protegidas**: tudo sob `_auth` (conta, pagamento, pedido).
  - O redirecionamento acontece uma única vez, usando o último endereço privado visitado. Isso evita laço quando a sessão expira no meio da navegação.
  - O `redirect` é validado (`safe-redirect.ts`): só caminhos internos são aceitos.
- **Troca de usuário**: login com outra conta ou mudança do token em outra aba (evento `storage`) limpa o cache privado antes de carregar os dados do novo usuário.
- **Logout**: encerra a sessão local mesmo sem rede.

## Estado do carrinho

- **Servidor como fonte**: o carrinho é sempre o que `GET /cart` devolve, e o resumo vem calculado pela API (subtotal, desconto, taxa de rede, total).
  - Cada item traz `issues`: `price-changed`, `sold-out` ou `insufficient-stock`.
  - A tela mostra as pendências, e `POST /cart/accept-changes` aceita os novos preços.
- **Visitante**: o carrinho é identificado por um id aleatório em `localStorage` (`nft.guest-cart-id`), enviado no cabeçalho `X-Guest-Cart`, e fica em cache como `['cart', 'guest']`.
- **Login**: `POST /cart/merge` soma o carrinho do visitante ao da conta (respeitando estoque e limite por pedido) e descarta o do visitante.
- **Mutações**:
  - alterar a quantidade mostra o valor pendente e desfaz em caso de erro;
  - remover oferece **Desfazer**, que adiciona o item de volta.
- **Edição na linha**: cada linha do carrinho é um par (NFT, edição), com preço e estoque próprios.

## Pedido e idempotência

1. **Cotação** (`POST /checkout/quote`): congela itens, preços, cupom e taxa por 5 minutos.
2. **Pedido** (`POST /orders`): recebe `quoteId`, carteira e dados do comprador, com o cabeçalho `Idempotency-Key`.
   - A chave é gerada uma vez por tentativa de compra e guardada em `sessionStorage` (`nft.checkout-attempt:<userId>`). Ela sobrevive a refresh e a cliques repetidos.
   - Mesma chave com o mesmo payload devolve o mesmo pedido, sem criar outro. Mesma chave com payload diferente devolve `409 IDEMPOTENCY_CONFLICT`. A comparação usa um hash estável do corpo, que inclui os campos aninhados.
   - Em erro transitório ou timeout (8 s), o cliente tenta de novo até 2 vezes com a mesma chave. Se a primeira requisição já tinha criado o pedido, a nova tentativa o recupera.
   - Erros do servidor: `409 PRICE_CHANGED` (o preço mudou depois da cotação) e `409 QUOTE_EXPIRED`. Ambos levam a uma nova cotação e a nova confirmação.
3. **Estoque**: é reservado na criação do pedido e devolvido se o pagamento é recusado.
4. **Liquidação**:
   - o pedido nasce `pending`, com um prazo `processAt` (4 s; 1,5 s no cenário instantâneo);
   - a liquidação é avaliada a cada leitura e por um temporizador, por isso continua correta mesmo depois de um refresh;
   - ao liquidar, o status vira `confirmed` (com `txHash`) ou `declined` e é emitido `order.updated`.
5. **Rascunho do checkout**: os dados do comprador ficam em `sessionStorage` por usuário e são restaurados ao voltar à página.

## Cache e novas tentativas

| Consulta                  | `staleTime` | Retry                                | Observações                                        |
| ------------------------- | ----------- | ------------------------------------ | -------------------------------------------------- |
| Padrão                    | 30 s        | 1                                    | `refetchOnWindowFocus` ligado                      |
| Listagem e detalhe do NFT | 30 s        | até 2 no detalhe, exceto `NOT_FOUND` | 404 mostra a página "Não encontramos este NFT"     |
| Sessão                    | —           | até 2, exceto erros de autenticação  |                                                    |
| Destaques                 | 60 s        | padrão                               |                                                    |
| Pedido pendente           | —           | padrão                               | polling de 3 s só enquanto `pending`               |
| Mutações                  | —           | 0                                    | a criação de pedido tem retry próprio, idempotente |

Outras regras:

- **Chaves** (`src/lib/query-keys.ts`):
  - os dados públicos ficam sob `['nfts', ...]`;
  - os privados ficam sob `['user', userId, ...]`, o que permite apagar tudo de um usuário com uma única chamada.
- **Catálogo**: os filtros vivem na URL (search params validados com zod), então voltar e avançar no navegador restauram a busca. A página anterior fica visível enquanto a próxima carrega (`placeholderData`).
- **Favoritos**: a mutação é otimista (`onMutate`). Em erro, o valor anterior é restaurado e um aviso é exibido.

## Camada de mocks

- **Banco**: `createPersistentState` grava cada tabela em `localStorage` (`nft-mock:db:v4`). A chave tem versão para que uma mudança de esquema não leia dados antigos.
- **Rede**: `withNetwork` aplica a latência do cenário (padrão de 120 a 350 ms, com semente fixa e, portanto, reproduzível) e as falhas configuradas por rota (`setFault`).
- **Socket.IO**:
  - `ws.link` do MSW com `@mswjs/socket.io-binding`;
  - o servidor simulado guarda as conexões abertas, publica eventos públicos para todas e eventos privados só para o dono do token;
  - `socketOutage(ms)` derruba as conexões e recusa novas durante o período.
- **Controle**: `window.__mocks` expõe cenários, falhas, eventos, queda do socket, expiração de sessões e reset. É usado pelos testes e pelo painel de cenários.

## Desvios e limitações conhecidas

### Diferenças em relação ao layout

- **Edição na linha do carrinho**: no layout, a linha não mostra a edição. Como cada edição tem preço e estoque próprios, a linha exibe o rótulo da edição e o id do token.
- **Recortes da galeria**: as miniaturas do detalhe são recortes da mesma arte. O Figma usa imagens que não estavam disponíveis para exportação.
- **"Código de indicação"**: no pagamento, o campo é obrigatório, como no layout. O valor aceito tem de 4 a 12 letras ou números.
- **Seções sem especificação**: newsletter, login social e as seções "Criadores", "Aprenda", "Atividade" e outras levam à página "Em breve".

### Limitações técnicas

- **Caminho do Socket.IO**: é `/realtime/`, e não o padrão `/socket.io/`, porque o `ws.link` do MSW não casa conexões nesse caminho. Com servidor real, basta ajustar `path`.
- **Heartbeat**: o binding do MSW não responde ao ping do engine.io. O servidor simulado envia `ping` a cada 20 s para o cliente não encerrar a conexão por inatividade.
- **Ordem de carregamento**: o `engine.io-client` captura o construtor `WebSocket` ao ser avaliado. Por isso ele só é importado depois que o MSW substituiu o `WebSocket`, e a aplicação só monta depois que o service worker assume a página.
- **Cookies no MSW**: o `tough-cookie` do MSW é substituído por um shim, porque esta API não usa cookies (ver `src/mocks/lib/tough-cookie-shim.ts`). Isso tira cerca de 120 KB com gzip do carregamento inicial.
- **Abas**: cada aba tem sua própria instância do MSW. O banco é compartilhado via `localStorage`, mas eventos emitidos numa aba não chegam às outras. Ao trocar de aba, o `refetchOnWindowFocus` reconcilia os dados.
- **Lighthouse mobile**: a cadeia MSW → service worker → API simulada está no caminho crítico e deixa a performance mobile entre 80 e 86. A análise completa está em [lighthouse/README.md](lighthouse/README.md).
- **Pagamento**: não há integração real com carteira. A conexão e a assinatura são simuladas, e o `txHash` é fictício.
