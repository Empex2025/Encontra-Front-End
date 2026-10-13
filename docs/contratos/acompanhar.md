# Contrato — Fluxo 4 · Contato e acompanhamento

Proposta do front para combinar com o back-end. Tudo exige sessão (cookie), salvo indicação. Erros no formato padrão `{ code, message, fields? }`. Datas em ISO 8601. Valores em centavos.

Não existe `GET|PUT /me/comparisons`: a lista de comparação fica no navegador (decisão 5 revisada).

## Favoritos

`GET /me/favorites?kind=product|service&filter=price_drop&sort=recent|price|distance&lat&lng`

```json
{
  "items": [
    {
      "item": {
        "...": "mesmo formato de um item de GET /search (inclui group, price, distanceKm, profile, status)"
      },
      "savedAt": "…",
      "change": { "kind": "price_drop", "text": "Baixou R$ 30,00 desde que você salvou" },
      "listCount": 1
    }
  ],
  "counts": { "all": 5, "priceDrop": 1, "products": 4, "services": 1 }
}
```

- `change`: `price_drop` quando o preço atual é menor que o **preço guardado ao salvar** (diferença > R$ 0,005); senão um evento do item (`kind: "event"`, ex. "Tamanho 41 voltou ao estoque"); sem nada, `null`. O texto vem pronto do servidor.
- Favoritos cujo item não existe mais **não vêm** e não contam.
- `sort=price`: sem preço vai para o fim. `sort=distance`: precisa de `lat`/`lng`; sem eles cai em `recent`.
- Adicionar/remover: `POST /me/favorites {type,id}` e `DELETE /me/favorites/{type}/{id}` (ver `decidir.md`).

`GET /me/following` → `{ "items": [{ "profile": { id, slug, kind: "store"|"provider"|"place", name, avatarUrl, verified, typeLabel, distanceKm, whatsapp }, "news": { "kind": "coupon"|"new", "text": "…" } | null }] }`. `news` só quando há novidade real (cupom ativo ou produtos novos recentes). Deixar de seguir: `DELETE /profiles/{id}/follow`.

## Listas

- `GET /me/lists` → `{ items: [{ id, name, itemCount, shared, sharedWith: string|null, thumbnails: string[≤4] }] }`
- `POST /me/lists {name}` (1–40 caracteres; nasce vazia e privada) → lista criada. Erro de campo `fields.name`.
- `GET /me/lists/{id}` → lista + `items` (mesmo formato dos favoritos, sem `change`).
- `POST /me/lists/{id}/items {type,id}` · `DELETE /me/lists/{id}/items/{type}/{itemId}` — um item pode estar em várias listas; só entra item já favoritado (o servidor favorita junto se faltar).
- `POST /me/lists/{id}/share` → `{ url }` (link público, quem abrir vê e comenta).
- `DELETE /me/lists/{id}`.

## Alertas

`GET /me/alerts` → `{ items: [{ id, active, conditions[], belowCents, size, radiusKm, channels[], city, expiresAt, lastTrigger: { at, text } | null, product: { id, slug, title, imageUrl }, profile: { name } | null }] }` · `PATCH /me/alerts/{id} {active}` · `DELETE /me/alerts/{id}`. Criar é `POST /me/alerts` (ver `decidir.md`). Valem 30 dias; `lastTrigger` só se o alerta disparou de verdade.

## Notificações

- `GET /notifications?type=alert|coupon|store|activity&page` → `{ items: [{ id, type: "alert"|"coupon"|"store"|"activity"|"security", title, text, createdAt, read, imageUrl, action: { label, href } | null }], total, page, limit, unread: { all, alert, coupon, store, activity } }`
- `href` é um caminho do app (produto, loja, `/atividade?aba=cupons`…) **escolhido pelo servidor**. O front só aceita caminhos que comecem com `/`.
- `POST /notifications/{id}/read` · `POST /notifications/read-all` (opcional `type`) · `DELETE /notifications/{id}` (remover não marca como lida).
- `GET /notifications/unread-count` já existe no contrato base.
- `GET|PUT /me/notification-prefs` → `{ categories: { alerts, offers, stores, activity: boolean }, channels: { site: true, email, whatsapp: boolean } }`. O servidor garante **pelo menos "site"** ligado e que segurança nunca é desligada.

## Atividade (`/atividade?aba=orcamentos|promocao|avaliacoes|cupons|vistos`)

- `GET /me/activity/summary` → contadores `{ quotes (não cancelados), wants (não expirados), reviews, coupons (ativos) }`.
- Orçamentos: `GET /me/quotes` → `[{ id, profile: { slug, name, kind } | null, service, when, createdAt, status: "waiting"|"answered"|"accepted"|"done"|"declined"|"canceled", priceCents, note, conversationId }]` · `POST /quotes/{id}/accept` (o servidor manda mensagem automática ao prestador pelo chat) · `POST /quotes/{id}/cancel`.
- Quero em promoção: `GET /me/wants` (formato de `POST /me/wants`, mais `found: { count, href } | null`) · `POST /me/wants/{id}/cancel` · pedir de novo = `POST /me/wants` com os mesmos dados. Lojas veem só **quantas pessoas**, nunca quem.
- Avaliações: `GET /me/reviews` → `[{ id, targetType, targetTitle, targetHref, createdAt, rating, text, photoCount, status: "pending"|"published", reply: string|null }]` · `PATCH /me/reviews/{id} {rating,text}` · `DELETE /me/reviews/{id}`.
- Cupons: `GET /me/coupons` → `[{ id, code, benefit, status: "active"|"used"|"expired", profile: { slug, name }, validUntil }]`, ordem Ativo → Usado → Vencido.
- Vistos recentemente ficam **só no navegador** (`encontrae_vistos`, até 20). Para mostrar título e foto, o front consulta `GET /recent?items=product:slug,store:slug` (novo; público) → `{ items: [{ type, slug, title, imageUrl, href }] }`; itens que não existem mais não voltam.

## Conversas (chat próprio)

- `GET /conversations?q=&unread=1` → `{ items: [{ id, profile: { id, slug, kind, name, avatarUrl }, online, context: string|null (ex. "Tênis X · Maceió"), last: { text, hasImage, mine, at } | null, unread, muted, blocked }], unreadTotal }` ordenado pela última mensagem.
- `POST /conversations {profileId, productId?, serviceId?, draft?}` → `{ id }`. Reaproveita a conversa do perfil; produto diferente troca o contexto. `draft` ≤ 500 caracteres.
- `GET /conversations/{id}` → resumo + `product: { slug, title, priceCents, imageUrl } | null`, `status: { online, responseText }` ("responde em ~5 min"), `profileHref`.
- `GET /conversations/{id}/messages?before=<id>` → `{ items: [{ id, mine, text, imageUrl, at }], hasMore }` (marca como lidas).
- `POST /conversations/{id}/messages {text?, imageKey?}` — texto ≤ 500; vazio sem foto = 422. Foto: `POST /uploads/presign {purpose:"chat", contentType, size}` → `{ uploadUrl, key }`, envio direto do navegador, depois `imageKey`. Só JPG/PNG/WEBP até 5 MB.
- `PUT /conversations/{id}/mute {muted}` · `PUT /conversations/{id}/block {blocked}` · `DELETE /conversations/{id}` (apaga só para quem apagou) · `POST /reports {conversationId, reason, details?, alsoBlock}`.
- **Tempo real:** o front usa consulta periódica (5 s com a conversa aberta, 30 s na lista). Socket.IO (`message:new`, `message:read`, `typing`, `presence`, `unread:count`) fica como melhoria quando o back-end tiver o canal; "digitando…" e "online" só aparecem se o servidor mandar.

## Avaliar (`/avaliar?tipo=produto|servico|loja|prestador&id=<slug>`)

- `GET /review-targets/{tipo}/{slug}` → `{ type, title, subtitle, imageUrl, neighborhood, backHref, highlights: { positive[], negative[] } }`.
- `POST /uploads/presign {purpose:"review", contentType, size}` (fotos JPG/PNG; vídeo MP4 até 60 s e o servidor confere).
- `POST /reviews {targetType, targetId, rating 1–5, photoKeys[2–6], videoKey?, text? ≤1500, highlights[], extras?: {service, response}, showName}` → `{ id, status: "pending" }`. Nasce **pendente de moderação** (aparece em até 24 h). 422 com `fields` por campo.
- Rascunho: ficam no navegador (`encontrae_rascunho_avaliacao:{tipo}:{id}`), não vão ao servidor.
