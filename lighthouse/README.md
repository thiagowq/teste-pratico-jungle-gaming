# Auditoria Lighthouse

Resultados em [`summary.md`](summary.md) (mediana de 3 medições por página e perfil). Os relatórios completos estão em [`reports/`](reports): um HTML e um JSON por medição. O ambiente (versões, sistema, CPU) está em [`summary.json`](summary.json).

## Como reproduzir

```bash
npm run build
npm run lighthouse
```

O script [`scripts/lighthouse.mjs`](../scripts/lighthouse.mjs) faz o seguinte:

1. sobe o `vite preview` do build de produção, com os mocks ligados e o cenário padrão;
2. abre o Google Chrome estável em headless pelo Playwright;
3. mede o início (`/`) e o detalhe (`/nft/emerald-ape-042`) três vezes em cada perfil:
   - mobile: padrão do Lighthouse, com Moto G Power, 4G lento e CPU 4× mais lenta;
   - desktop: configuração oficial de desktop.

Cada medição começa em estado limpo, sem cache, service worker ou storage.

Variáveis opcionais:

- `LH_RUNS`: número de medições, 3 por padrão;
- `LH_CHANNEL=chromium`: usa o Chromium do Playwright;
- `CHROME_PATH`: outro executável do Chrome.

## Metas

| Categoria | Meta | Resultado |
| --- | --- | --- |
| Performance | ≥ 90 | desktop 99 nas duas páginas; mobile 80 (início) e 86 (detalhe) |
| Acessibilidade | ≥ 95 | 100 em todas |
| Boas práticas | ≥ 95 | 100 em todas |
| SEO | ≥ 90 | 100 em todas |

## Otimizações aplicadas

- **SEO** (83 → 100): adicionados a meta description e o `robots.txt`. Sem o arquivo, o servidor da SPA devolvia o `index.html` para essa URL, e o Lighthouse o considerava inválido.
- **CLS do detalhe no desktop** (0.206 → 0): enquanto a rota carregava, o rodapé aparecia logo abaixo do cabeçalho e depois era empurrado para baixo. Agora o conteúdo tem altura mínima de uma tela, e o rodapé começa fora da área visível.
- **Mocks fora do caminho crítico**:
  - o MSW usa o `tough-cookie` (com a lista de sufixos públicos do `tldts`) só para guardar cookies de respostas mockadas, e esta API não usa cookies, porque a sessão vai no cabeçalho `Authorization`;
  - um alias para um shim mínimo ([`src/mocks/lib/tough-cookie-shim.ts`](../src/mocks/lib/tough-cookie-shim.ts)) reduziu o chunk dos mocks de 143 KB para 23 KB com gzip.
- **Carregamento em paralelo**: o MSW e a aplicação são baixados ao mesmo tempo. Só a montagem espera o service worker. O `socket.io-client` passou a ser importado na primeira conexão, depois da renderização inicial.
- **Herói do início**: é renderizada só a variante da largura atual. Antes, a imagem prioritária do desktop era baixada também no mobile, embora ficasse oculta.

## Por que o mobile fica abaixo de 90

Nas medições reais, sem simulação, o LCP no mobile fica entre 0,4 s e 1,0 s. O valor simulado chega a cerca de 4 s porque o Lighthouse projeta, em 4G lento com CPU 4× mais lenta, uma cadeia que só existe nesta demonstração sem backend:

1. o HTML carrega o script inicial;
2. o script baixa o MSW e a aplicação;
3. o service worker do MSW é registrado e assume a página;
4. a aplicação monta e chama a API simulada;
5. só então a imagem do NFT é pedida.

Os passos 2 e 3 (cerca de 55 KB de JavaScript com gzip, mais o registro do worker) não existiriam com uma API real. Nesse caso, a cadeia se reduz a HTML → JS da aplicação → API → imagem.

Pré-carregar a imagem do primeiro NFT no `index.html` melhoraria a nota, mas acoplaria o HTML estático aos dados do catálogo. Por isso ficou de fora.

Próximos passos possíveis com um backend real:

- desligar os mocks no build (`VITE_ENABLE_MOCKS=false`);
- renderizar no servidor (SSR) ou pré-carregar os dados da rota inicial.
