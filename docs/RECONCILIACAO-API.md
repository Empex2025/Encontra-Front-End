# Reconciliação de rotas: front-end do consumidor × back-end

Levantamento de 14/10/2026. Compara **método e caminho** das rotas que o front chama (`src/lib/api/*.ts`, repositório `Encontra-Front-End`, branch `feat/comparacao-conta-lista-publica`) com as rotas dos controladores do back-end (`backend/src/**/*.controller.ts`, branch `main`, commit `8b69b26`).

**O que este levantamento NÃO cobre:** o formato dos campos de pedido e resposta. Mesmo nas linhas "Igual", é preciso conferir os campos com o contrato em `docs/contratos/*.md` do front. O prefixo global `/api/v1` está confirmado no código do back-end (`src/common/http/api-prefix.ts`).

## Resumo

| Situação | Grupos de rotas | Significado |
|---|---|---|
| Igual | 11 | Mesmo método e caminho. Só conferir os campos. |
| Outro nome ou formato | 26 | A função existe, mas com caminho ou formato diferente. |
| Parcial | 15 | Existe parte da função. |
| Falta | 15 | Não encontrei rota equivalente. |
| A confirmar | 2 | Não consegui concluir pela leitura dos caminhos. |
| **Total** | **69** | Os 69 grupos cobrem as cerca de 105 chamadas do front. |

## Rotas por área

### Entrada e conta

| Front chama | Back-end tem | Situação | Observação |
|---|---|---|---|
| `POST /auth/login` | `POST /auth/login` | Igual | |
| `POST /auth/register` | `POST /auth/register` | Igual | Conferir CPF obrigatório e código por SMS. |
| `POST /auth/otp/send`, `/verify`, `/resend` | `POST /auth/verification/request`, `/confirm` | Outro nome | Reenvio: confirmar se `request` serve. |
| `POST /auth/password/channels` | — | Falta | Lista por onde a pessoa pode receber o código. |
| `POST /auth/password/forgot`, `/reset` | `POST /auth/forgot-password`, `/reset-password` | Outro nome | |
| `POST /auth/logout` | `POST /auth/logout` | Igual | |
| `GET /me`, `GET /me/profile`, `PATCH /me` | `GET /users/me` (e `/auth/me`), `PATCH /users/me` | Outro nome | |
| `PUT /me/password` | `PATCH /users/me/password` | Outro nome | |
| `GET/DELETE /me/sessions`, `DELETE /me/sessions/{id}` | `GET /auth/sessions`, `DELETE /auth/sessions/{id}`, `POST /auth/sessions/logout-all` | Outro nome | |
| `/me/addresses` (listar, criar, editar, remover) | `/users/me/addresses` (+ `POST /{id}/primary`) | Outro nome | Front define o endereço principal pela edição. |
| `GET/PUT /me/interests` | `GET/PUT /users/me/interests` | Outro nome | Só o prefixo muda. |
| `GET/PUT /me/location` | `PATCH /users/me/location` | Parcial | Não há leitura (`GET`). |
| `GET/PATCH /me/notification-prefs` | `GET/PUT /users/me/notification-preferences` | Outro nome | Front usa `PATCH`. |
| `POST/DELETE /me/deletion` | `POST /users/me/delete`, `POST /users/me/deactivate` | Parcial | Falta cancelar a exclusão dentro de 30 dias. |
| `POST /me/export` | — | Falta | Exportar dados (LGPD). |
| `GET/DELETE /me/search-history` | — | Falta | |
| `GET /geo/cep/{cep}` | `GET /companies/cep/{cep}` | Parcial | Parece ser do cadastro de empresa. |
| `GET /geo/reverse` | — | Falta | Nome do bairro a partir da posição. |

### Busca e descoberta

| Front chama | Back-end tem | Situação | Observação |
|---|---|---|---|
| `GET /search` | `GET /search/products`, `/search/stores` | Parcial | Front espera uma lista única, com filtros, contagens por filtro e o campo `group`. |
| `GET /search/autocomplete` | `GET /search/autocomplete` | Igual | Front também usa `type=place`. |
| `GET /discovery/nearby` | `GET /discovery/nearby` | Igual | |
| `GET /discovery/home` | `GET /discovery`, `/discovery/new`, `/discovery/offers` | Parcial | Front espera uma resposta única com os blocos da Home. |
| `GET /discovery/trending` | `GET /discovery/trending` | Igual | |
| `GET /discovery/prices` | — | Falta | Radar do bairro (preços). |
| `GET /me/radar`, `POST /me/radar/seen` | — | Falta | Meu Radar. |
| `GET /recent` | — | Falta | |
| `GET/POST /me/wants`, `POST /me/wants/{id}/cancel` | `/promo-requests` (+ `POST /{id}/interest`) | Parcial | Parece a mesma entidade ("Quero em promoção"); confirmar. |

### Produto, loja e avaliações

| Front chama | Back-end tem | Situação | Observação |
|---|---|---|---|
| `GET /products/{slug}`, `/related` | `GET /public/products/{companySlug}/{productSlug}`, `/catalog/items/{id}`, `/recommendations/...` | Outro formato | Front usa **um** slug; o back-end usa dois (empresa e produto). |
| `GET /profiles/{slug}` e `/products`, `/posts`, `/offers`, `/similar` | `GET /public/stores/{companySlug}/{storeSlug}` (+ `/products`, `/categories`), `GET /social/stores/{storeId}/posts` | Parcial | Falta `/similar`. Mesmo tema dos dois slugs. |
| Perfil de prestador de serviço | — | A confirmar | Não vi modelo de prestador separado de loja. |
| `GET /{products ou profiles}/{slug}/reviews` | `GET /reviews/public/{targetType}/{targetId}` | Outro formato | |
| `GET /review-targets/{tipo}/{slug}` | — | Falta | Dados para a tela de avaliar. |
| `POST /reviews` | `POST /reviews` | Igual | |
| `POST/DELETE /reviews/{id}/helpful` | `POST /reviews/{id}/helpful` | Parcial | Falta desfazer ("útil"). |
| `GET /me/reviews`, `PATCH/DELETE /me/reviews/{id}` | `GET /reviews/mine`, `PATCH/DELETE /reviews/{id}` | Outro nome | |
| `GET /offers`, `GET /offers/{slug}` | `GET /discovery/offers`, `GET /public/offers/{offerId}` | Outro nome | Front usa slug na oferta. |
| `POST /coupons/{id}/claim` | `POST /coupons/{couponId}/claim` | Igual | |
| `GET /me/coupons` | `GET /coupons/mine` | Outro nome | |
| `GET /comparisons/view` | `GET /catalog/items/{id}/compare`, `GET /public/products/.../compare` | Outro formato | Front compara até 3 itens escolhidos pela pessoa. |
| `GET/POST/DELETE /me/comparisons` | — | Falta | Comparações salvas na conta. |
| `GET /share/{tipo}/{id}` | `GET /public/share/{resource}/{id}` | Outro nome | |

### Guardar e acompanhar

| Front chama | Back-end tem | Situação | Observação |
|---|---|---|---|
| `GET/POST /me/favorites`, `DELETE /me/favorites/{tipo}/{id}` | `GET/POST /favorites`, `DELETE /favorites/{id}` | Outro formato | Front remove por tipo e id. |
| `GET /me/following`, `POST/DELETE /profiles/{id}/follow`, `PUT /profiles/{id}/bell` | `/follows` (`GET`, `POST`, `DELETE /{storeId}`, `PATCH /{storeId}`) | Outro nome | |
| `/me/lists` (criar, ver, excluir) e itens | `/lists`, `POST /lists/{id}/items`, `DELETE /lists/{id}/items/{itemId}` | Outro nome | Front remove item por tipo e id. |
| `POST/DELETE /me/lists/{id}/share`, `GET /share/lists/{token}` | — | Falta | Lista compartilhada com link público. |
| `/me/alerts` (listar, criar, ativar, excluir) | `/alerts` | Outro nome | |
| `GET /notifications`, `POST /{id}/read`, `/read-all` | iguais | Igual | |
| `GET /notifications/unread-count` | `GET /notifications/unread` | Outro nome | Confirmar se devolve só a contagem. |
| `DELETE /notifications/{id}` | — | Falta | |

### Contato

| Front chama | Back-end tem | Situação | Observação |
|---|---|---|---|
| `GET/POST /conversations`, detalhe, `GET/POST .../messages` | iguais | Igual | Conferir cursor `before`. |
| `PUT .../mute`, `PUT .../block`, `DELETE /conversations/{id}` | `PATCH /conversations/{id}`, `/blocks` | Parcial | Bloqueio existe por usuário. |
| `POST /uploads/presign` | `POST /uploads/image` | Outro formato | Front envia direto ao armazenamento por URL assinada, para fotos e vídeo. |
| `POST /quotes`, `GET /me/quotes`, `POST /quotes/{id}/accept`, `/cancel` | `GET/POST /quotes`, `PATCH /quotes/{id}` | Parcial | Aceitar e cancelar via `PATCH`? Confirmar. |

### Descobrir (stories, lives, eventos)

| Front chama | Back-end tem | Situação | Observação |
|---|---|---|---|
| `GET /stories` | `GET /social/stores/{storeId}/stories` | Parcial | Front precisa de um feed por local, não só por loja. |
| `POST /stories/{id}/view` | `POST /social/stories/{storyId}/view` | Outro nome | |
| `POST/DELETE /stories/{id}/like` e `/save` | `POST /social/stories/{storyId}/interact` | Outro formato | |
| `GET /lives`, `GET /lives/{id}`, `POST /lives/{id}/like`, `POST /lives/{id}/messages` | iguais | Igual | |
| `GET /lives/{id}/messages` | — | Falta | Leitura do chat da live. |
| `POST/DELETE /lives/{id}/reminder` | — | Falta | |
| `GET /happenings`, `/{id}`, `POST/DELETE .../attendance` | `/agenda/events`, `/{id}`, `.../attendance` | Outro nome | |
| `GET /happenings/{id}/calendar.ics` | — | Falta | |
| `POST/DELETE /posts/{id}/like` | `POST /social/posts/{postId}/like` | Parcial | Falta descurtir. |

### Suporte e sistema

| Front chama | Back-end tem | Situação | Observação |
|---|---|---|---|
| `GET /help/faq`, `POST /help/faq/{id}/feedback` | `GET /support/faqs` | Parcial | Falta o "ajudou?". |
| `POST /help/contact` | `POST /support/tickets` | Outro nome | |
| `GET /legal`, `GET /legal/{doc}` | `GET /support/legal/{slug}` | Outro nome | Falta o índice. |
| `GET /reports/target`, `POST /reports` | `POST /reports` | Parcial | Falta a leitura do alvo da denúncia. |
| `GET /status`, `POST /status/notify` | `GET /health/live`, `/health/ready` | Parcial | Falta o aviso "me avise quando voltar". |
| `POST /tracking` | `POST /events` | A confirmar | Conferir se são os mesmos eventos. |
| `GET /map` | — | Falta | Bloqueado: o serviço de mapas ainda não foi escolhido. |

## Pontos de decisão

1. **Quem se adapta nas 26 linhas "Outro nome ou formato".** O front concentra todos os caminhos em `src/lib/api/*.ts`, então ajustar nomes simples (`/me/...` para `/users/me/...`) é barato do lado do front. Já os formatos diferentes (um slug contra dois, favoritos por tipo e id, upload por URL assinada, stories por local) mudam o contrato e precisam de acordo entre as duas equipes.
2. **As 15 linhas "Falta"** são funções que o produto prevê e que ainda não existem no back-end. As principais para o consumidor: Meu Radar e Radar de preços, comparações salvas, lista compartilhada pública, exportar dados, histórico de busca, `calendar.ics`, lembrete da live e feed de stories.
3. **Login Google e Apple.** O back-end já tem (`/auth/oauth/{provider}/...`). A decisão de produto foi deixar fora da versão 1 e exigir CPF no cadastro.
4. **Painel do lojista e administração.** O back-end já tem rotas `merchant` e `admin`; este levantamento não as cobre.
