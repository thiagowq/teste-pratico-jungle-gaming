# Kurio · NFT Marketplace

Marketplace de NFTs com catálogo, detalhe com edições, carrinho, pagamento com carteira cripto, confirmação, conta (perfil, carteiras e favoritos) e atualizações de preço e pedido em tempo real.

A API REST e o servidor Socket.IO são simulados no navegador com [MSW](https://mswjs.io). A demonstração funciona sem backend, inclusive no deploy, e os cenários de falha podem ser reproduzidos a qualquer momento.

- **Arquitetura e decisões**: [ARCHITECTURE.md](ARCHITECTURE.md).
- **Auditoria Lighthouse**: [lighthouse/README.md](lighthouse/README.md).

## Stack

| Área               | Tecnologias                                                                     |
| ------------------ | ------------------------------------------------------------------------------- |
| Base               | React 19 com React Compiler, TypeScript, Vite                                   |
| Roteamento e dados | TanStack Router (rotas por arquivo, code splitting), TanStack Query, Axios      |
| Contratos          | zod como fonte única dos tipos; valores em ETH como string decimal (decimal.js) |
| Tempo real         | Socket.IO (`socket.io-client`)                                                  |
| Interface          | Tailwind CSS v4 e shadcn/ui (Radix), ícones exportados do Figma                 |
| Mocks              | MSW 2, com `@mswjs/socket.io-binding` para o tempo real                         |
| Qualidade          | Playwright (E2E, regressão visual e axe), Lighthouse, ESLint, Prettier          |

## Como rodar

Requisitos: Node.js 22 ou superior (desenvolvido com o 24) e npm.

```bash
npm install
npm run dev
```

A aplicação abre em <http://localhost:5173>.

Para o build de produção:

```bash
npm run build
npm run preview
```

### Variáveis de ambiente

Os arquivos `.env.development` e `.env.production` já trazem os valores da demonstração. O modelo comentado está em `.env.example`.

| Variável            | Padrão       | Uso                                                                                                         |
| ------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true`       | Liga o MSW (REST e Socket.IO). Com `false`, o código dos mocks e o painel de cenários ficam fora do bundle. |
| `VITE_API_URL`      | `/api`       | Base das chamadas REST.                                                                                     |
| `VITE_SOCKET_URL`   | mesma origem | Endereço do servidor Socket.IO, caso exista um real.                                                        |

## Dados da demonstração

### Contas

| Nome              | E-mail                    | Senha        |
| ----------------- | ------------------------- | ------------ |
| Ana Colecionadora | `colecionador@kurio.test` | `Kurio@2026` |
| Bruno Cripto      | `segundo@kurio.test`      | `Kurio@2027` |

A Ana já tem duas carteiras salvas. Também é possível criar uma conta nova em **Cadastro**.

As senhas são fictícias e ficam no banco simulado só como hash SHA-256 com salt.

### Cupons

| Código       | Efeito                                              |
| ------------ | --------------------------------------------------- |
| `KURIO10`    | 10% de desconto                                     |
| `GENESIS05`  | 0.05 ETH de desconto em pedidos a partir de 0.5 ETH |
| `BOASVINDAS` | expirado (exibe o erro de cupom expirado)           |

Qualquer outro código é inválido.

### Persistência e reset

O banco simulado fica no `localStorage` (chaves `nft-mock:*`). Por isso o catálogo, o carrinho, os pedidos e as contas sobrevivem ao refresh.

Para voltar ao estado inicial, há duas formas:

- usar **Restaurar dados iniciais** no painel de cenários;
- rodar no console:

  ```js
  localStorage.clear()
  sessionStorage.clear()
  __mocks.reset()
  location.assign('/')
  ```

## Cenários e falhas simuladas

### Painel de cenários

O botão com o ícone de frasco, fixo na borda direita da tela, abre o painel. Ele permite:

- **trocar o cenário**: padrão, instantâneo, rede lenta, latência variável, sem conexão, erro do servidor (503), catálogo vazio, pagamento recusado, carteira recusa e timeout no pedido;
- **mexer no mercado**: subir ou baixar o preço, esgotar ou repor a edição do NFT aberto, o que emite `nft.updated` pelo Socket.IO;
- **simular problemas de conexão e sessão**: derrubar o tempo real por 5 s ou expirar a sessão;
- **restaurar os dados iniciais**.

### Outras formas de escolher o cenário

- **Pela URL**: `?mock-scenario=<nome>` em qualquer página, por exemplo `/?mock-scenario=slow`. A escolha fica salva para os próximos carregamentos.
- **Pelo console**, com `window.__mocks`:

  ```js
  __mocks.presets // nomes dos cenários
  __mocks.setScenario('payment-declined')
  __mocks.setFault('POST /orders', { fault: { kind: 'timeout' }, times: 1 }) // falha pontual por rota
  __mocks.updateEdition('emerald-ape-042', '1-50', { priceEth: '1.49' }) // nft.updated
  __mocks.socketOutage(5000) // tempo real fora do ar por 5 s
  __mocks.expireSessions()
  __mocks.reset()
  ```

### Como reproduzir os fluxos de falha

| Fluxo                         | Como reproduzir                                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Pagamento recusado            | Cenário **Pagamento recusado** e concluir uma compra. O pedido vai para "recusado", o estoque é devolvido e o carrinho continua igual.    |
| Clique repetido no pagamento  | Clicar várias vezes em **Confirmar e pagar**. A chave de idempotência garante um único pedido.                                            |
| Timeout ao criar o pedido     | Cenário **Timeout no pedido**. A primeira resposta se perde após 8 s, e a nova tentativa, com a mesma chave, recupera o pedido já criado. |
| Preço muda durante o checkout | Com o NFT no carrinho e a revisão do pedido aberta, usar **Preço +10%** no painel. A cotação é refeita e pede nova confirmação.           |
| Edição esgotada               | **Esgotar edição** no painel, com o detalhe ou o carrinho aberto.                                                                         |
| Queda do tempo real           | **Derrubar tempo real por 5 s**. Aparece o indicador "Reconectando…" e, ao voltar, as consultas ativas são recarregadas pela API.         |
| Sessão expirada               | Logado, usar **Expirar sessão** e navegar. Páginas privadas levam ao login e voltam para onde o usuário estava.                           |
| Rede lenta, offline, erro 503 | Cenários correspondentes. Aparecem skeletons, mensagens de erro e o botão **Tentar novamente**.                                           |
| Carteira recusa a conexão     | Cenário **Carteira recusa** e escolher uma carteira no pagamento.                                                                         |

## Scripts

| Comando                                   | O que faz                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                             | Servidor de desenvolvimento                                                    |
| `npm run build`                           | Checagem de tipos e build de produção                                          |
| `npm run preview`                         | Serve o build                                                                  |
| `npm run typecheck`                       | Só a checagem de tipos                                                         |
| `npm run lint`                            | ESLint                                                                         |
| `npm run format` / `npm run format:check` | Prettier                                                                       |
| `npm run test:e2e`                        | Suíte Playwright (desktop e mobile), que gera o build e sobe o preview sozinha |
| `npm run test:e2e:ui`                     | Playwright em modo interativo                                                  |
| `npm run test:e2e:update`                 | Regera as baselines visuais                                                    |
| `npm run test:e2e:report`                 | Abre o último relatório                                                        |
| `npm run lighthouse`                      | Auditoria Lighthouse (rodar depois do `build`)                                 |
| `npm run images` / `npm run icons`        | Regeram imagens otimizadas e ícones a partir de `design-assets/`               |

## Testes

```bash
npx playwright install chromium
npm run test:e2e
```

A suíte roda em dois projetos: desktop (1440×900) e mobile (390×844). Cada teste começa com dados e cenário restaurados.

Cenários cobertos:

1. catálogo: busca, filtros, ordenação, paginação e histórico;
2. detalhe: acesso direto e recurso inexistente;
3. conta: cadastro, login, expiração, logout e troca de usuário;
4. favoritos: persistência, falha da mutation e recuperação;
5. carrinho: quantidades, remoção, cupom e persistência;
6. compra completa, do catálogo ao recibo;
7. falha de pagamento, clique repetido e timeout com recuperação;
8. perfil, avatar, senha e carteiras com erros de validação;
9. preço e disponibilidade via Socket.IO durante o checkout;
10. eventos duplicados ou antigos, desconexão e retomada de pedido pendente;
11. teclado, foco em diálogos, validação acessível e axe;
12. skeletons em carregamento lento, falha e recuperação.

Além disso:

- o painel de cenários tem um teste próprio;
- a regressão visual compara início, detalhe, carrinho e pagamento com as baselines em `tests/e2e/__screenshots__`.

## Lighthouse

Mediana de 3 medições por página e perfil. Detalhes e justificativas em [lighthouse/README.md](lighthouse/README.md).

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |
| ------- | ------- | ----------: | -------------: | ------------: | --: |
| Início  | mobile  |          80 |            100 |           100 | 100 |
| Início  | desktop |          99 |            100 |           100 | 100 |
| Detalhe | mobile  |          86 |            100 |           100 | 100 |
| Detalhe | desktop |          99 |            100 |           100 | 100 |

## Deploy

O projeto é uma SPA estática: o build fica em `dist/`, com os mocks ligados. O `vercel.json` reescreve as rotas para o `index.html`, então o acesso direto a qualquer URL funciona.

Na Vercel:

1. importar o repositório;
2. manter o preset Vite (build `npm run build`, saída `dist`);
3. publicar.

Não é preciso configurar variáveis de ambiente, porque o `.env.production` já liga os mocks.

## Estrutura

```text
src/
  api/          cliente Axios, contratos zod e módulos por recurso
  features/     funcionalidades (auth, catálogo, detalhe, carrinho, checkout, pedidos, carteiras, favoritos, demo)
  routes/       rotas do TanStack Router (por arquivo)
  realtime/     cliente Socket.IO, filtro de eventos e sincronização com o cache
  mocks/        MSW: banco simulado, fixtures, handlers REST e Socket.IO, cenários
  components/   layout, componentes de UI (shadcn) e ícones
  lib/          utilitários (formatação, chaves de cache, formulários)
tests/e2e/      Playwright
lighthouse/     relatórios e resumo da auditoria
design-assets/  artes e frames originais exportados do Figma
```
