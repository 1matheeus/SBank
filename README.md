# S Bank

Landing page de um banco digital moderno, feita em HTML, CSS e JavaScript puros, sem build.

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
