# Contrato — Oferta pública (`/o/{slug}`) e prévia de links

Base: Documento de entrega › Compartilhado. A página abre sem conta; ações que pedem conta mostram o convite.

## `GET /api/v1/offers/{slug}` — público
```json
{ "id": "…", "slug": "liquida-tenis", "title": "20% em tênis", "description": "Só hoje", "imageUrl": null,
  "status": "active", "endsAt": "2026-10-13T18:00:00Z",
  "profile": { "id": "…", "slug": "loja-a", "kind": "store", "name": "Loja A", "avatarUrl": null, "whatsapp": "5582…", "status": { "state": "open", "text": "Aberto agora" } },
  "product": { "slug": "tenis-x", "title": "Tênis X", "priceCents": 19990, "oldPriceCents": 24990 },
  "coupon": { "...Coupon": "igual ao do Produto" },
  "location": { "address": "Rua A, 10", "neighborhood": "Farol", "lat": null, "lng": null, "distanceKm": 1.2 },
  "more": [ "…até 3 SearchItem da mesma loja" ], "similar": [ "…até 3 SearchItem de outras lojas" ] }
```
- 404 quando a oferta não existe (a página mostra "Este link não está mais disponível").
- Oferta que já terminou: **200** com `status: "ended"` (a página mostra "Oferta encerrada" e não indexa). O front também considera encerrada quando `endsAt` já passou.
- `endsAt` `null` = sem prazo (não há contagem).
- Cupom: resgate por `POST /coupons/{id}/claim`; `coupon.claimed` depende da sessão.

## Prévia de links (Open Graph) e SEO
As páginas `/p/{slug}`, `/l/{slug}`, `/s/{slug}` e `/o/{slug}` geram título, descrição, imagem e dados estruturados **no servidor do front**, lendo as mesmas rotas públicas (`GET /products/{slug}`, `GET /profiles/{slug}`, `GET /offers/{slug}`) **sem cookies**. Por isso:
- essas rotas precisam responder **sem sessão** e responder 404 de verdade quando o item não existe;
- o front precisa de `BACKEND_URL` (já usado no rewrite) e `NEXT_PUBLIC_SITE_URL` (endereço público, para URLs absolutas das prévias);
- imagem de prévia: URL absoluta e pública (https), de preferência 1200×630.
- Pendente no back-end para indexação: lista de URLs públicas (ex.: `GET /sitemap/{products|profiles|offers}?page=`) com `slug` e `updatedAt`, para o front gerar o `sitemap.xml`.
