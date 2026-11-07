# Assets do design

Origem: arquivo Figma **Frontend Challenge** (cópia de trabalho `RtbEAGAn7BrUTNewSnTnAF`), lido pela REST API do Figma em 06/11/2026.

| Pasta | Conteúdo | Uso |
| --- | --- | --- |
| `nfts/` | As 4 artes originais (PNG 1254×1254, sem alteração) | Fonte de `npm run images`, que gera AVIF/WebP responsivos em `public/images/nfts/` |
| `frames/` | Render 1× de cada frame (9 desktop, 6 mobile) | Referência visual para implementação e comparação |

Os ícones (pacote Iconly usado no layout) foram exportados em SVG para `src/assets/icons/`. `npm run icons` troca a cor única de cada ícone por `currentColor`, preservando a cor original do Figma no atributo `color` da raiz: o visual padrão é idêntico e os estados de interação podem recolorir via CSS.

O arquivo contém duas imagens que não aparecem em nenhum frame (capturas de outro produto); elas foram ignoradas.
