# Contrato — Home · Meu Radar e Radar do bairro

Proposta do front. Base: Fluxo 2 do Documento de entrega. Regra de dados: nada é inventado; se o servidor não tem base real, a parte some.

## `GET /api/v1/me/radar` — público (visitante recebe só `new` e `price`)

```json
{
  "items": [
    { "id": "r1", "kind": "price", "title": "Tênis X baixou de preço", "detail": "R$ 199 na Loja Y · 1,2 km",
      "at": "2026-10-12T14:00:00Z", "seen": false, "href": "/p/tenis-x" }
  ],
  "unseen": 3,
  "counts": { "all": 5, "new": 2, "price": 1, "follow": 1, "alert": 1 },
  "tracking": { "follows": 4, "alerts": 2, "interests": ["Moda", "Casa"] }
}
```

- `kind` ∈ `new` (verde), `price` (âmbar), `follow` (azul), `alert` (vermelho). Até 8 itens, mais recentes primeiro.
- `href` é caminho interno (`/p/…`, `/l/…`, `/s/…`, `/eventos/…`). O front ignora o clique em qualquer valor que não comece com uma única `/`.
- `tracking` só com sessão (`null` para visitante); alimenta a linha "Acompanha: N lojas que você segue · N alertas · interesses: …".
- `unseen` define "Seu radar encontrou N novidade(s)" ou "Você está em dia".

## `POST /api/v1/me/radar/seen` — com sessão
Corpo `{ "ids": ["r1"] }`. Idempotente. 204.

## `GET /api/v1/discovery/trending?lat&lng&radiusKm`
```json
{ "area": "Centro",
  "searches": [ { "term": "tênis", "searches": 120, "growthPct": 35 } ],
  "places":   [ { "profile": { "id": "…", "slug": "loja-y", "name": "Loja Y", "kind": "store" }, "signal": "Novo no bairro", "branch": "Moda", "distanceKm": 0.8 } ] }
```
- Até 5 em cada lista. `area` é o nome do bairro onde a conta foi feita; sem ele a coluna "Mais procurados" some.
- `searches` só com volume mínimo definido pelo servidor (privacidade: sem buscas de poucas pessoas).
- `signal` é texto pronto do servidor e deve vir de uma regra real (novidade, aumento de visitas…).

## `GET /api/v1/discovery/prices?lat&lng&radiusKm`
```json
{ "items": [ { "item": "Gasolina comum", "valueCents": 589, "basis": "média de 6 postos", "changePct": -2.1,
               "period": "7 dias", "direction": "down", "href": "/explorar?q=gasolina&lente=prices" } ] }
```
- Até 5. `direction` ∈ `up`, `down`, `flat`. Só com base de cálculo real (`basis` obrigatório) e preços atualizados.

## Revisão de fidelidade ao protótipo (15/10/2026)

Em `GET /discovery/prices`, dois campos opcionais:

- `items[].series`: preços recentes, do mais antigo ao mais novo (mínimo 2 valores, em reais), para o minigráfico. Sem `series`, o gráfico não aparece.
- `headline`: `{ "title": "A gasolina caiu 3,2% perto de você esta semana", "detail": "Menor preço agora: R$ 5,79 no Posto Avenida, a 1,6 km.", "direction": "down", "href": "/explorar?q=gasolina" }`. Faixa de destaque do Radar do bairro; só aparece se o servidor mandar (precisa de base real, como o resto do bloco).
