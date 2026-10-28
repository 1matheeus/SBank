# S Bank

Site do S Bank com landing page (`/`) e um **app de finanças pessoais** (`/app/`), em HTML, CSS e JavaScript puros, sem build.

## App de finanças (`app/`)

- **Aportes:** registre ganhos e gastos com valor, descrição, data e categoria (Alimentação, Moradia, Transporte, Assinaturas, Roupas, Saúde, Lazer, Educação… e categorias próprias).
- **Extrato:** movimentações do mês agrupadas por dia, com busca e filtros por tipo e categoria. Toque em uma movimentação para editar ou excluir.
- **Gráficos:** gastos/ganhos por categoria, ganhos x gastos dos últimos 6 meses e gasto acumulado no mês.
- **IA:** o Claude (API da Anthropic) analisa seus dados e devolve resumo, alertas, dicas e gráficos. Usa a sua chave da API, salva só no aparelho.
- **Dados:** ficam no navegador do aparelho. Em *Ajustes* dá para exportar (`.json` e `.csv`), importar, ou sincronizar direto com um arquivo no GitHub.
- **iPhone:** no Safari, toque em *Compartilhar → Adicionar à Tela de Início* para usar como app em tela cheia (funciona offline, exceto a IA).

### Compras do Apple Pay automáticas

Uma automação “Transação” do app Atalhos grava cada compra paga com o iPhone em `inbox/compra-AAAAMMDD-HHmmss.json` no repositório privado de dados. Ao abrir, o app importa esses arquivos para o extrato, sugere a categoria (pela última vez que você usou aquele estabelecimento ou pelo nome) e apaga o arquivo.

### Onde ficam os dados

O arquivo exportado vai em `data/`. O workflow `.github/workflows/pages.yml` copia o site e o app para a branch `gh-pages` (fonte do Pages) a cada push na `main`; a pasta `data/` nunca é publicada. Como o repositório é público, guarde seus dados em um repositório privado separado.

### Bibliotecas incluídas

- `app/vendor/chart.umd.js`: Chart.js 4.4.7
- `app/vendor/anthropic.mjs`: `@anthropic-ai/sdk` 1.3.0 empacotado com esbuild

Ao alterar arquivos do app, aumente a versão de `CACHE` em `app/sw.js` para os aparelhos baixarem a atualização.

## Identidade visual

| Token | Cor | Uso |
|---|---|---|
| Verde dinheiro | `#2F6B4F` (escuro: `#86C9A3`) | Cor principal: botões, abas, links |
| Sálvia | `#E3EBE4` | Cartão de saldo e superfícies suaves |
| Dourado suave | `#E6D39A` | Ponto da logo |
| Grafite | `#151A16` / fundo `#F3F4F1` | Texto e fundos neutros |

- **Tipografia:** fonte do sistema (SF Pro no iPhone e no Mac), com espaçamento ajustado por tamanho e respeito ao tamanho de texto do iOS.
- **Movimento:** molas interrompíveis (amortecimento + resposta, como no iOS), painéis arrastáveis com momento, deslizar para apagar e barra de abas de vidro. Respeita “Reduzir movimento” e “Reduzir transparência”.
- **Logo:** um "S" geométrico de traço contínuo dentro de um quadrado arredondado verde sólido. O ponto dourado no canto superior representa rendimento.
  - `assets/logo-mark.svg`: só o símbolo (favicon e ícone do app)
  - `assets/logo.svg`: símbolo com o nome

## Rodar localmente

Abra o `index.html` no navegador ou rode:

```bash
python3 -m http.server 8000
```

## Seções

Hero com cartão 3D interativo, recursos, cartão com cashback, simulador de investimentos, segurança e CTA. O layout é responsivo e respeita `prefers-reduced-motion`.
