# S Bank

Site do S Bank com landing page (`/`) e um **app de finanças pessoais** (`/app/`), em HTML, CSS e JavaScript puros, sem build.

## App de finanças (`app/`)

- **Aportes:** registre ganhos e gastos com valor, descrição, data e categoria (Alimentação, Moradia, Transporte, Assinaturas, Roupas, Saúde, Lazer, Educação… e categorias próprias).
- **Extrato:** movimentações do mês agrupadas por dia, com busca e filtros por tipo e categoria. Toque em uma movimentação para editar ou excluir.
- **Gráficos:** gastos/ganhos por categoria, ganhos x gastos dos últimos 6 meses e gasto acumulado no mês.
- **IA:** o Claude (API da Anthropic) analisa seus dados e devolve resumo, alertas, dicas e gráficos. Usa a sua chave da API, salva só no aparelho.
- **Dados:** ficam no navegador do aparelho. Em *Ajustes* dá para exportar (`.json` e `.csv`), importar, ou sincronizar direto com um arquivo no GitHub.
- **iPhone:** no Safari, toque em *Compartilhar → Adicionar à Tela de Início* para usar como app em tela cheia (funciona offline, exceto a IA).

### Onde ficam os dados

O arquivo exportado vai em `data/`. O workflow `.github/workflows/pages.yml` copia o site e o app para a branch `gh-pages` (fonte do Pages) a cada push na `main`; a pasta `data/` nunca é publicada. Como o repositório é público, guarde seus dados em um repositório privado separado.

### Bibliotecas incluídas

- `app/vendor/chart.umd.js`: Chart.js 4.4.7
- `app/vendor/anthropic.mjs`: `@anthropic-ai/sdk` 1.3.0 empacotado com esbuild

Ao alterar arquivos do app, aumente a versão de `CACHE` em `app/sw.js` para os aparelhos baixarem a atualização.

## Identidade visual

| Token | Cor | Uso |
|---|---|---|
| Violeta | `#7C5CFF` | Cor primária, início do gradiente |
| Menta | `#00D4A6` | Crescimento, valores positivos, fim do gradiente |
| Lima | `#D9FF5C` | Acento ("faísca" da logo, destaques) |
| Ink | `#0B0F1A` | Texto e seções escuras |

- **Tipografia:** Sora (títulos) + Inter (texto).
- **Logo:** um "S" geométrico de traço contínuo dentro de um quadrado arredondado com gradiente violeta→menta. A faísca lima no canto superior representa crescimento e rendimento.
  - `assets/logo-mark.svg`: só o símbolo (favicon e ícone do app)
  - `assets/logo.svg`: símbolo com o nome

## Rodar localmente

Abra o `index.html` no navegador ou rode:

```bash
python3 -m http.server 8000
```

## Seções

Hero com cartão 3D interativo, recursos, cartão com cashback, simulador de investimentos, segurança e CTA. O layout é responsivo e respeita `prefers-reduced-motion`.
