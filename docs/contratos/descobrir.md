# Contrato — Fluxo 2 (restante) · Stories, Ao vivo e Evento

Proposta do front para combinar com o back-end. Abertos a visitantes na leitura; ações de conta pedem sessão (cookie). Erros no formato padrão `{ code, message, fields? }`. Datas em ISO 8601. Valores em centavos.

## Stories

`GET /stories?lat&lng&radiusKm&start={profileId}&profile={slug}&highlight={id}&preview=1`

```json
{
  "groups": [
    {
      "profile": {
        "id": "…",
        "slug": "…",
        "name": "Loja A",
        "kind": "store|provider",
        "verified": true,
        "avatarUrl": null,
        "typeLabel": "Moda"
      },
      "distanceKm": 2.4,
      "following": false,
      "seen": false,
      "highlight": null,
      "stories": [
        {
          "id": "…",
          "mediaUrl": "…",
          "mediaType": "image|video",
          "caption": "…",
          "publishedAt": "…",
          "views": 120,
          "likes": 8,
          "liked": false,
          "saved": false,
          "tag": {
            "kind": "product|service|offer|place",
            "title": "…",
            "priceCents": 27990,
            "productId": "…",
            "productSlug": "…",
            "couponId": null,
            "imageUrl": null
          }
        }
      ]
    }
  ],
  "interests": ["Moda", "Pet"]
}
```

- Ordem: perfis que a pessoa segue primeiro, depois os próximos. Só stories das últimas 24 h (destaques não expiram). Grupo sem story não vem.
- `start`: abre a fila naquele perfil (ele vem primeiro). `profile`: só os stories daquele perfil (slug). `highlight`: só os stories daquele destaque (`highlight` vem preenchido `{id, name}` no grupo).
- `preview=1`: só a faixa da Home — seguidos primeiro, depois **até 6** não seguidos; pode trazer só o 1º story de cada grupo.
- `interests`: nomes dos 2 primeiros interesses da pessoa (vazio para visitante) — para "Mais para você · por causa de …".
- `seen`: o servidor guarda (resolve "visto da Home não é guardado").
- `POST /stories/{id}/view` → 204 (o front manda uma vez por story por sessão; o servidor não deve contar a mesma conta duas vezes).
- `POST|DELETE /stories/{id}/like` → `{ likes }` (pede sessão).
- `POST|DELETE /stories/{id}/save` → 204 (pede sessão). **Se o story marca um produto, o servidor também liga/desliga o produto em Favoritos**; `saved` já vem verdadeiro quando o produto está nos Favoritos.
- Seguir: `POST|DELETE /profiles/{id}/follow` (já existente).
- Responder / "Quero comprar" / "Pedir orçamento": `POST /conversations { profileId, productId?, draft?, firstMessage?, origin: { kind: "story", id } }`. `draft` só preenche o campo da conversa; `firstMessage` **envia na hora** (resposta ao story, até 300 caracteres, uma por story). A resposta traz `{ id }`.
- "Pegar cupom": `POST /coupons/{id}/claim` (já existente).
- Compartilhar: o front usa o endereço da tela (`/stories?perfil={slug}`), sem `GET /share/story/{id}`.

## Ao vivo

`GET /lives/{id}` →

```json
{
  "id": "…",
  "title": "…",
  "place": "Centro, Maceió",
  "profile": {
    "id": "…",
    "slug": "…",
    "name": "…",
    "kind": "store",
    "verified": true,
    "following": false,
    "whatsapp": null
  },
  "viewers": 124,
  "likes": 340,
  "startedAt": "…",
  "endedAt": null,
  "coverUrl": null,
  "streamUrl": null,
  "status": "live|ended",
  "products": [
    {
      "id": "…",
      "slug": "…",
      "title": "…",
      "priceCents": 27990,
      "oldPriceCents": null,
      "tag": "20% off",
      "imageUrl": null,
      "pinned": true
    }
  ],
  "reminder": false,
  "lat": null,
  "lng": null
}
```

- **404** se a live não existe ou terminou há muito tempo. O front consulta de novo a cada 10 s enquanto `status=live` (espectadores, curtidas, fim da live).
- `streamUrl`: endereço do vídeo ao vivo. O front usa um `<video>` comum (funciona com MP4/WebM e com HLS só no Safari). **Para HLS em todos os navegadores é preciso escolher o serviço de streaming** e acrescentar o player (pendência externa).
- Chat: `GET /lives/{id}/messages?after={messageId}` → `{ items: [{ id, author, fromStore, mine, text, sentAt }] }` (o front consulta a cada 3 s e mostra as 40 últimas); `POST /lives/{id}/messages { text }` (1–200 caracteres; pede sessão) → a mensagem criada.
- Curtir: `POST /lives/{id}/like` → `{ likes }`; cada toque soma 1, não há descurtir (pede sessão).
- Lembrete por loja: `POST|DELETE /lives/{id}/reminder` (já em `decidir.md`); vale para a loja da live. Pede sessão.
- Outras lives: `GET /lives?status=live&lat&lng&radiusKm&exclude={id}` → `{ items: [{ id, title, viewers, coverUrl, profileName, place, distanceKm? }] }` (`distanceKm` opcional: aparece como "· 0,9 km" no cartão, como no protótipo).
- Denunciar: `POST /reports { type: "live", targetId }` (tipos novos: `live` e `evento`).
- "Quero comprar": `POST /conversations { profileId, productId, draft, origin: { kind: "live", id } }`.
- **Socket.IO** (`live:message`, `live:viewers`, `live:pinned`, `live:ended`) fica para depois: hoje o front consulta periodicamente. O envio de mensagem já devolve a mensagem criada, então trocar por Socket.IO não muda o contrato acima.

## Evento

`GET /happenings/{id}` →

```json
{
  "id": "…",
  "title": "…",
  "organizer": { "name": "Loja A", "slug": "loja-a", "profileId": "…", "kind": "store" },
  "neighborhood": "Farol",
  "distanceKm": 2.4,
  "address": "Rua A, 10",
  "lat": null,
  "lng": null,
  "startsAt": "…",
  "endsAt": null,
  "free": true,
  "priceCents": null,
  "coverUrl": null,
  "about": "…",
  "schedule": [{ "time": "19:00", "title": "Abertura", "detail": null }],
  "offer": { "…": "mesmo formato de cupom (id, title, code, percentOff, validUntil, claimed)" },
  "going": 12,
  "interested": 30,
  "tags": ["Pet friendly"],
  "myAttendance": null,
  "attendeesPreview": [{ "name": "Ana", "avatarUrl": null }],
  "followedGoing": 2,
  "signupWhatsapp": null
}
```

- **Decisão:** "Vou" e "Tenho interesse" são **exclusivos** (marcar um troca o outro; o contador de cada um é ajustado). O documento deixava em aberto.
- `POST /happenings/{id}/attendance { kind: "going"|"interested" }` troca a marcação; `DELETE /happenings/{id}/attendance?kind=…` remove. 204. Pede sessão. O servidor avisa 1 h antes quem marcou "going".
- `GET /happenings?lat&lng&radiusKm&exclude={id}` → `{ items: [{ id, title, startsAt, neighborhood, distanceKm, free, coverUrl }] }` (respeita o raio).
- `GET /happenings/{id}/calendar.ics` → arquivo de agenda (o botão abre direto; sem sessão).
- Cupom do evento: `POST /coupons/{id}/claim`; cupons em Atividade (`/me/coupons`).
- "Perguntar": `POST /conversations { profileId: organizer.profileId, draft, origin: { kind: "happening", id } }`. Sem `profileId` (organizador sem perfil) o botão não aparece.
- Inscrição paga: se `signupWhatsapp`, aparece "Inscrição pelo WhatsApp" (só em evento pago).
- Denunciar: `POST /reports { type: "evento", targetId }`.
- O selo do dia ("Hoje", dia da semana) e a situação ("Faltam N dias") são **calculados no front** a partir de `startsAt`/`endsAt` (sem fim informado, assume 3 h).

## Endereços das telas

O documento prevê `/s/{perfil}-{n}` para story, `/live/{id}` e `/evento/{id}`. No código `/s/` já é o perfil do prestador e `/ao-vivo/{id}` já é usado pelos cards; ficaram: `/stories?perfil=&destaque=&inicio=`, `/ao-vivo/{id}`, `/eventos/{id}`. Se for preciso manter os endereços do documento, é uma troca de rota (os links saem de `src/lib/routes.ts`).
