# Contrato — Decidir: Produto, Loja, Prestador e ações

Proposta do front para combinar com o back-end. Base: Fluxo 3 do Documento de entrega. Tudo em `/api/v1`, erros no padrão `{ code, message, fields? }`, datas em ISO 8601. **Visitante lê tudo**; as ações marcadas "conta" respondem 401 sem sessão (o front mostra o convite antes de chamar).

Regras gerais: sem carrinho nem checkout (pagamento combinado direto com a loja). Campo sem dado vem `null` e o front mostra "Não informado" ou esconde o bloco; **o front nunca inventa valor**.

## Leitura

### `GET /products/{slug}`

Endereço público `/p/{slug}`. 404 `NOT_FOUND` se não existir.

```json
{
  "id": "…",
  "slug": "tenis-corrida-x",
  "title": "Tênis de corrida X",
  "description": "…",
  "categoryId": "esporte",
  "group": { "id": "tenis", "label": "Tênis" },
  "media": [{ "id": "…", "type": "image", "url": "…", "posterUrl": null, "viewsText": null }],
  "profile": "ProfileSummary (abaixo)",
  "rating": 4.8,
  "reviewCount": 120,
  "sold": 340,
  "price": { "amountCents": 27990, "oldAmountCents": 34990, "updatedAt": "2026-10-10T10:00:00Z" },
  "location": { "distanceKm": 2.4, "neighborhood": "Farol", "city": "Maceió", "lat": null, "lng": null },
  "sizes": [{ "label": "42", "available": false }],
  "stock": { "state": "available", "units": 6, "pickupText": "Retirada hoje até 18h" },
  "maxQuantity": 6,
  "storeBadges": ["Estacionamento", "Retirada na loja", "Pix e cartão na loja"],
  "specs": [{ "label": "Peso", "value": "280 g" }],
  "coupon": {
    "id": "…",
    "title": "10% OFF em tênis",
    "code": "ESPORTE10",
    "percentOff": 10,
    "priceCents": 25191,
    "validUntil": "2026-10-12T23:59:00-03:00",
    "claimed": false
  },
  "sameLine": { "count": 3, "fromCents": 23990, "promoCount": 2 },
  "favorited": false,
  "alert": null,
  "about": { "address": "Rua …", "hoursText": "Seg–Sáb 9h–19h", "responseTime": "~5 min" }
}
```

- `sizes` é `null` se o produto não tem tamanho. Tamanho esgotado: `available: false`.
- `stock.state`: `available`, `unavailable` ou `unknown` (nunca afirmar "disponível" sem dado).
- `coupon.priceCents` é o preço com cupom, **calculado no servidor** (preço × (1 − %), respeitando mínimo e validade). `claimed` é por pessoa; visitante recebe `false`.
- `favorited`, `alert` (alerta ativo do usuário neste produto) vêm preenchidos só com sessão.
- `maxQuantity`: 1 até o estoque informado, no máximo 6.
- Preço traz `updatedAt` para o selo "Preço informado em {data}".

### `ProfileSummary` (loja ou prestador)

```json
{
  "id": "…",
  "slug": "loja-a",
  "kind": "store",
  "name": "Loja A",
  "handle": "lojaa",
  "avatarUrl": null,
  "verified": true,
  "verification": "verified",
  "followers": 12400,
  "following": false,
  "status": { "state": "open", "text": "Aberto agora · fecha às 19h" },
  "whatsapp": "5582999998888",
  "responseTime": "~5 min",
  "live": { "id": "…", "viewers": 12 },
  "categoryId": "esporte"
}
```

- `kind`: `store` ou `provider`. `verification`: `verified`, `pending`, `none`.
- `following` e o sino só com sessão; visitante sempre `false`.
- `status.state`: `open`, `soon`, `closed`, calculado pelos horários reais; `text` já formatado. `null` se não houver horário cadastrado.
- `whatsapp`: só dígitos com DDI. `null` esconde o botão do WhatsApp (nunca um número inventado).
- `responseTime`: texto do tempo médio real de resposta no chat, ou `null`.

### `GET /profiles/{slug}`

`ProfileSummary` e mais:

```json
{
  "bio": "…",
  "categoryLabel": "Esporte",
  "coverUrl": null,
  "stats": { "rating": 4.9, "reviewCount": 320, "products": 120, "posts": 48, "respondsPct": 98 },
  "followedBy": { "names": ["Ana", "Bruno"], "others": 3 },
  "address": {
    "street": "Rua …",
    "neighborhood": "Centro",
    "city": "Maceió",
    "lat": null,
    "lng": null,
    "distanceKm": 1.2
  },
  "hours": [{ "day": 1, "text": "09:00–19:00" }],
  "since": { "business": 2009, "platform": 2024 },
  "badges": ["Retira hoje na loja", "Entrega no bairro", "Troca em 30 dias"],
  "payment": ["Pix", "Cartão"],
  "cnpjVerified": true,
  "highlights": [{ "id": "…", "label": "Novidades", "coverUrl": null, "seen": false }],
  "provider": null
}
```

- `hours`: 7 linhas, `day` 0 (domingo) a 6; `text` já formatado ou "Fechado".
- Para `kind: "provider"`, `provider` vem preenchido:

```json
{
  "title": "Eletricista residencial",
  "group": { "id": "eletricista", "label": "Eletricista" },
  "serviceMode": "home",
  "homeRadiusKm": 8,
  "areas": ["Farol", "Ponta Verde"],
  "jobsDone": 210,
  "yearsExperience": 12,
  "recommendPct": 97,
  "nextSlot": "Hoje, 14h",
  "services": [
    { "id": "…", "name": "Troca de tomada", "description": "…", "durationMinutes": 30, "fromCents": 8000 }
  ],
  "photos": [{ "id": "…", "url": "…" }]
}
```

`serviceMode`: `local`, `home` ou `both`. `fromCents: 0` ou `null` = "Sob orçamento". Com `nextSlot` o selo mostra o próximo horário livre; senão `responseTime`.

### `GET /profiles/{slug}/products?q&sort&cat&page&limit`

`sort` ∈ `best_selling` (padrão), `price_asc`, `price_desc`. Resposta: a de `GET /search` (`items`, `total`, `facets.categories` para as categorias com contagem). Respeita o raio do usuário só para calcular `distanceKm`.

### `GET /profiles/{slug}/posts?page&limit`

Fotos e vídeos da loja: `{ items: [{ id, type: "image"|"video", url, posterUrl, caption, createdAt, viewsText, durationText, likes, comments, liked, product: { slug, title, priceCents } | null }], total, page, limit }`. `liked` só com sessão.

### `GET /profiles/{slug}/offers`

`{ coupon: Coupon|null, live: { id, title, viewers }|null, upcomingLives: [{ id, title, startsAt, reminded }], event: { id, title, startsAt, place }|null, promoCount: number }`. Cada bloco só vem se existir.

### `GET /products/{slug}/reviews` e `GET /profiles/{slug}/reviews`

Parâmetros: `filter` (`all`, `photos`, `5`…`1`), `sort` (`recent` padrão, `helpful`), `page`, `limit` (5).

```json
{
  "summary": {
    "average": 4.8,
    "total": 120,
    "distribution": { "5": 100, "4": 12, "3": 5, "2": 2, "1": 1 },
    "attributes": [{ "label": "Atendimento", "value": 4.9 }],
    "recommendPct": 97
  },
  "filters": [{ "id": "all", "label": "Todas", "count": 120 }],
  "items": [
    {
      "id": "…",
      "author": "Maria S.",
      "createdAt": "…",
      "context": "Comprou e retirou na loja",
      "sizeLabel": "42",
      "rating": 5,
      "text": "…",
      "photoUrls": [],
      "helpfulCount": 3,
      "markedHelpful": false,
      "reply": { "author": "Loja A", "text": "…", "createdAt": "…" }
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 5
}
```

`attributes` e `recommendPct` são opcionais. `distribution` e `filters[].count` vêm do servidor.

### `GET /products/{slug}/related`

`{ items: SearchItem[] }` — "Quem viu este produto também viu" (até 4). Vazio some o bloco.

### `GET /profiles/{slug}/similar`

`{ items: SearchItem[] }` — "Outros {categoria} perto de você" (até 3, do mais perto ao mais longe, mesmo grupo).

## Ações (conta)

| Rota                                                                                          | Corpo                                                                                                                                                       | Resposta                                                                                                                                                         |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /profiles/{id}/follow`, `DELETE …`                                                      | —                                                                                                                                                           | 204. Seguidores ±1 no servidor                                                                                                                                   |
| `PUT /profiles/{id}/bell` `{ enabled }`                                                       |                                                                                                                                                             | 204. Sino só vale para quem segue                                                                                                                                |
| `POST /me/favorites` `{ type: "product"\|"profile", id }`, `DELETE /me/favorites/{type}/{id}` |                                                                                                                                                             | 204. Ao favoritar produto, o servidor guarda o **preço e a data do momento** (para avisar baixa)                                                                 |
| `POST /me/alerts`                                                                             | `{ productId, conditions: ["restock","price_drop","promo","other_store"], belowCents?, size?, radiusKm: 5\|10\|20, channels: ["site","whatsapp","email"] }` | `Alert` com `expiresAt` (30 dias). **Um alerta por produto e pessoa: criar de novo substitui.** `price_drop` com `belowCents` opcional; 422 `ALERT_NO_CONDITION` |
| `DELETE /me/alerts/{id}`                                                                      |                                                                                                                                                             | 204                                                                                                                                                              |
| `POST /coupons/{id}/claim`                                                                    | —                                                                                                                                                           | `Coupon` com `claimed: true`. Um por loja por pessoa; 409 `COUPON_ALREADY_CLAIMED`; 410 `COUPON_EXPIRED`                                                         |
| `POST /conversations`                                                                         | `{ profileId, productId?, serviceId?, draft?: string }`                                                                                                     | `{ id }`. Cria ou reabre a conversa carregando loja, produto, título, preço e foto. `draft` é rascunho (só com quantidade > 1 ou pergunta pronta)                |
| `POST /quotes`                                                                                | `{ profileId, serviceId, when: "today"\|"tomorrow"\|"week"\|"flexible", neighborhood?, details?, via: "chat"\|"whatsapp" }`                                 | `{ id, conversationId \| null, whatsappUrl \| null }`. Cria a conversa e aparece em Atividade › Orçamentos. `details` até 400 caracteres                         |
| `POST /reviews/{id}/helpful`, `DELETE …`                                                      | —                                                                                                                                                           | `{ helpfulCount }`. Um voto por pessoa                                                                                                                           |
| `POST /lives/{id}/reminder`, `DELETE …`                                                       | —                                                                                                                                                           | 204. Avisa 10 min antes                                                                                                                                          |
| `POST /posts/{id}/like`, `DELETE …`                                                           | —                                                                                                                                                           | `{ likes }`                                                                                                                                                      |
| `POST /me/wants`                                                                              | (contrato da busca)                                                                                                                                         |                                                                                                                                                                  |

`Coupon`: `{ id, title, code, percentOff, minCents, validUntil, claimed }`.

## Compartilhar e denunciar

- `GET /share/{type}/{id}` (`type` ∈ `product`, `profile`) → `{ url, title, text }`. O link público é `/p/{slug}`, `/l/{slug}` ou `/s/{slug}`. **Nenhum dado do usuário vai no link.**
- `POST /reports` `{ targetType, targetId, reason, details? }` → 204 (Fluxo 5).

## Eventos (`POST /tracking`)

`PRODUCT_VIEW`, `STORE_VIEW`, `SERVICE_VIEW` (uma vez por item a cada 30 min), `PRODUCT_FAVORITE`, `STORE_FAVORITE`, `WHATSAPP_CLICK`, `PHONE_CLICK`, `ROUTE_REQUESTED`, `PRODUCT_SHARED`, `ALERT_CREATED`. Um clique em WhatsApp é "contato iniciado", nunca "venda".

## Ofertas & Promoções — `GET /offers`

Público. Parâmetros: `lat`, `lng` (ou `where`), `radiusKm` (1/3/5/10/20/50), `q`, `cat` (CAT12), `sort` (`relevance` | `distance` | `price` | `discount`), `openNow` (1), `page`, `limit` (12).

Resposta: **igual à de `GET /search`** (itens, `total`, `facets.categories` só com categorias que têm oferta, `widen`, `nearestOutside`) mais:

```json
"coupons": [
  { "id": "…", "title": "…", "code": "ESPORTE10", "percentOff": 10, "minCents": 10000, "validUntil": "…", "claimed": false,
    "profile": { "id": "…", "slug": "loja-a", "name": "Loja A", "avatarUrl": null } }
]
```

`coupons` = cupons do dia das lojas dentro do raio (até 10). `claimed` considera a pessoa logada; resgate pelo mesmo `POST /coupons/{id}/claim` do Produto. Só entram itens com desconto/oferta ativa de verdade; sem oferta → lista vazia (a tela mostra estado vazio e o convite "Quero em promoção").

### Extensões da fidelidade ao protótipo (16/10/2026) — `GET /offers`

Todas aditivas; ausentes, a tela some com a linha/seção correspondente (nada é inventado):

- `sort=ending` (acaba primeiro) além dos já listados.
- Cada item: `endsAt` (ISO, fim da oferta; quando cai hoje a foto ganha "Acaba hoje") e `offerSlug` (para compartilhar `/o/{slug}`; sem ele o link é o do produto).
- Cada cupom: `distanceKm` (número ou `null`) e `categoryId` (CAT12), usados no cartão do cupom.
- `lowestPrices[]` (padrão `[]`): "Menores preços" perto de você. Item: `{ id, item (nome do produto), priceCents, unit?, profile { id, slug, name }, distanceKm | null, saving { cents, others } | null, updatedAt, href? }`. `saving` = quanto sai mais barato que as outras `others` lojas do raio; `updatedAt` é obrigatório porque preço antigo precisa ser mostrado como tal.

## Campos opcionais de confiança (auditoria, 14/10/2026)

Aditivos e opcionais; ausentes, o front mostra "Não informado":

- `GET /products/{slug}` → `stock.updatedAt` (ISO): quando a loja informou a disponibilidade.
- `GET /profiles/{slug}` → `updatedAt` (ISO): última atualização do perfil pela loja.
- `GET /offers/{slug}` → `profile.verification` (`verified`/`pending`/`none`).
