# Contrato — serviços do prestador (tipos de preço)

Proposta do front (não existe rota publicada ainda). Vale para `GET /profiles/{slug}` → `provider.services[]`.

```json
{ "id": "…", "name": "Instalação de ponto", "description": "…", "durationMinutes": 60,
  "fromCents": null,
  "priceType": "unit", "priceCents": 2500, "unitLabel": "ponto", "minCents": 5000 }
```

| `priceType` | O que a tela mostra | Botão |
|---|---|---|
| `fixed` | R$ valor | Solicitar serviço |
| `from` | a partir de R$ valor | Solicitar serviço |
| `hour` | R$ valor por hora (· mín. R$ x) | Solicitar serviço |
| `unit` | R$ valor por `unitLabel` (padrão "unidade") (· mín.) | Solicitar serviço |
| `period` | R$ valor por `unitLabel` (padrão "dia") (· mín.) | Solicitar serviço |
| `free` | Grátis | Solicitar serviço |
| `quote` | Sob orçamento | Pedir orçamento |
| `combine` | A combinar pelo chat | Combinar pelo chat (abre a conversa, sem formulário) |

Regras
- Todos os campos novos são opcionais. Sem `priceType`: `fromCents` preenchido = "a partir de"; vazio = "Sob orçamento".
- `priceType` com valor mas sem `priceCents` (e sem `fromCents`) cai em "Sob orçamento".
- A plataforma não cobra nem fecha valor: o preço é informativo e o valor final se combina no chat.
- Lógica em `src/lib/domain/service-price.ts` (testada).
