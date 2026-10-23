# Contrato — como receber (entrega, retirada, atendimento em casa)

Proposta do front. Campo opcional `fulfillment` nos itens de `GET /search` e `GET /discovery/nearby`.

```json
{ "fulfillment": { "delivers": true, "feeCents": 1000 } }          // produto: "Entrega R$ 10,00"
{ "fulfillment": { "delivers": true, "feeCents": 0 } }             // "Entrega grátis"
{ "fulfillment": { "delivers": false } }                           // "Só retirada"
{ "fulfillment": { "serviceVenue": "home", "feeCents": 2000 } }    // serviço: "Na sua casa · +R$ 20,00"
{ "fulfillment": { "serviceVenue": "online" } }                    // "Online"
```

Regras
- Retirada na loja sempre existe; por isso o lojista só marca "Faz entrega" (sim/não) e o valor (ou grátis).
- Sem `fulfillment` (ou serviço no local do prestador, que é o padrão) o cartão não mostra nada. Nada é inventado.
- Aparece na linha da distância, nunca sobre a foto. É informação: a plataforma não cobra nem fecha o valor, que se combina no chat.
- Lógica em `src/lib/domain/fulfillment.ts` (testada); componente `src/components/search/fulfillment-line.tsx` (cartões de Explorar e resultados).
- Fora deste PR: Ofertas, Favoritos, Perfil da loja, Início e página do produto.
