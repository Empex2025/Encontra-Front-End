# Contrato — Busca e descoberta (`GET /search`, `GET /discovery/nearby`)

Proposta do front para combinar com o back-end. Campos tirados do Documento de entrega (Explorar › Dados e Chamadas da API) e das decisões de 08/10 (raio 1/3/5/10/20/50, filtros "Onde atende", "Serviço", "Avaliação").

## Pedido

`GET /api/v1/search` — com termo. `GET /api/v1/discovery/nearby` — sem termo (descoberta), mesma resposta.

| Parâmetro | Tipo | Observação |
|---|---|---|
| `q` | texto | termo como digitado; o back interpreta "até R$ 300" e "mais barato" |
| `lat`, `lng` | número | ponto do usuário. Sem eles, usar `where` |
| `where` | texto | bairro/cidade quando não há coordenadas; o back converte em ponto |
| `radiusKm` | 1, 3, 5, 10, 20 ou 50 | padrão 50 |
| `cat` | id da CAT12 | opcional |
| `lens` | `live`, `offers`, `price`, `new`, `trending`, `open` | opcional |
| `kind` | `product`, `service`, `place` | opcional |
| `serviceMode` | `local`, `home` | opcional |
| `specialty` | lista | opcional, repetível |
| `minRating` | número | opcional (o front usa 4.8) |
| `sort` | `relevance`, `distance`, `price`, `rating` | padrão `relevance` |
| `page`, `limit` | inteiro | `limit` = 12 |

## Resposta

```json
{
  "items": [SearchItem],
  "total": 37,
  "page": 1,
  "limit": 12,
  "facets": {
    "categories": { "auto": 4, "servicos": 1 },
    "lenses": { "live": 0, "offers": 0, "price": 4, "new": 1, "trending": 0, "open": 4 },
    "kinds": { "product": 0, "service": 4, "place": 0 },
    "serviceMode": { "local": 3, "home": 1 },
    "specialties": [{ "id": "freios", "label": "Freios", "count": 1 }],
    "minRating": { "4.8": 2 }
  },
  "widen": { "nextRadiusKm": 10, "gain": 3 },
  "nearestOutside": { "name": "Mecânica do Tonho", "distanceKm": 7.9, "neighborhood": "Tabuleiro" },
  "similar": [SearchItem]
}
```

`facets` contam os itens no raio com os demais filtros aplicados (exceto o próprio). `widen` e `nearestOutside` podem ser `null`. Na descoberta, `facets` pode vir sem `kinds`, `serviceMode`, `specialties` e `minRating`.

### SearchItem

| Campo | Tipo | Observação |
|---|---|---|
| `id` | texto | estável |
| `type` | `product` \| `service` \| `place` | |
| `slug` | texto | do produto ou serviço; links públicos |
| `title`, `description` | texto | `description` pode ser `null` |
| `profile` | `{ id, slug, name, kind: "store"|"provider", verified }` \| `null` | quem oferece |
| `categoryId` | id CAT12 \| `null` | |
| `imageUrl` | texto \| `null` | |
| `distanceKm` | número \| `null` | `null` quando não dá para calcular — o front mostra "distância indisponível" |
| `neighborhood` | texto \| `null` | |
| `rating`, `reviewCount` | número \| `null`, inteiro | |
| `price` | `{ amountCents, oldAmountCents, unit, updatedAt }` \| `null` | `unit` ex.: "a partir de", "diagnóstico"; `updatedAt` ISO — o front mostra a data |
| `offerText` | texto \| `null` | |
| `isNew`, `trending`, `sponsored`, `homeService` | booleano | `sponsored` sempre exibe o selo "Patrocinado" |
| `live` | `{ id, viewers }` \| `null` | |
| `status` | `open` \| `soon` \| `closed` \| `null` | `null` = horário não informado |
| `availability` | `in_stock` \| `out_of_stock` \| `unknown` | só produto; `unknown` não exibe selo |
| `lat`, `lng` | número \| `null` | para o mapa; nunca inventados |
