# Contrato — Fluxo 5 · Conta, ajuda e sistema

Proposta do front para combinar com o back-end. Tudo exige sessão (cookie), salvo indicação. Erros no formato padrão `{ code, message, fields? }`. Datas em ISO 8601.

## Minha Conta

### Perfil

`GET /me/profile` →

```json
{
  "id": "…", "name": "Maria Souza", "email": "maria@…", "phone": "(82) 99999-8888", "phoneVerified": true,
  "cpfMasked": "***.456.789-**", "createdAt": "2026-03-02T…", "avatarUrl": null,
  "reviewNameStyle": "first_initial",
  "privacy": { "showNeighborhood": true, "keepSearchHistory": true, "suggestByInterests": true },
  "settings": { "whatsappOpen": "app", "autoplay": true, "sounds": true },
  "hasBusiness": false,
  "deletionScheduledFor": null
}
```

- O CPF **nunca** sai completo e **não** pode ser alterado.
- `PATCH /me` aceita qualquer subconjunto de `{ name, email, reviewNameStyle: "first_initial"|"full", privacy: {…parcial}, settings: {…parcial} }` e devolve o perfil completo. `name`: 2+ palavras, até 60. `email`: até 80, único (erro `fields.email`). Não aceita `phone` nem `cpf`.
- Trocar celular (só muda depois do código por SMS): `POST /auth/otp/send {purpose:"change_phone", phone}` → mesmo desafio de `docs/contratos/auth.md` (`challengeId`, `expiresAt`, `resendAt`…); `POST /auth/otp/verify {challengeId, code}` → **perfil atualizado** (o front reaproveita o passo de código do cadastro; reenvio por `POST /auth/otp/resend`).
- `GET /me` (já existente) continua trazendo `counters` (favoritos, seguindo, alertas) usados no cartão lateral.

### Endereços

- `GET /me/addresses` → `{ items: [{ id, label, cep, street, number, neighborhood, city, state, lat, lng, main }] }`. Sempre **exatamente um** `main: true`.
- `POST /me/addresses { label, cep, street, number?, neighborhood, city, state, lat, lng, main? }` → endereço. `label` até 30; vazio vira `"Outro"`. `cep` só dígitos (8). Se for o primeiro, vira principal.
- `PATCH /me/addresses/{id} { label?, main? }` — `main:true` desmarca o anterior. Mudar o principal muda o local de busca (`GET /me/location`).
- `DELETE /me/addresses/{id}` — **409** `LAST_ADDRESS` ("Mantenha pelo menos um endereço.") se for o último. Se apagar o principal, o servidor promove outro.
- `GET /geo/cep/{cep}` e `GET /geo/reverse?lat&lng`: como em `auth.md`.
- Raio padrão: `PUT /me/location { …, radiusKm }` (1/3/5/10/20/50), já existente.

### Interesses

`GET /me/interests` → `{ categoryIds: string[] }` · `PUT /me/interests { categoryIds }` (mínimo 3, ids da CAT12; **422** com `fields.categoryIds` se menos).

### Notificações

`GET /me/notification-prefs` → e `PATCH /me/notification-prefs` (parcial, devolve o objeto completo):

```json
{
  "categories": { "alerts": true, "offers": true, "stores": true, "chat": true, "nearby": false, "security": true },
  "channels": { "site": true, "whatsapp": true, "email": false },
  "quietHours": false
}
```

- `security` e `site` são **sempre true**: o servidor ignora tentativa de desligar (não erro).
- `nearby` ("Acontecendo perto de você") nasce desligado e, ligado, é resumo semanal.
- `quietHours`: não enviar das 22h às 8h (horário do usuário); segurança passa.
- **Mudança em relação ao Fluxo 4:** antes era `PUT` com `categories {alerts, offers, stores, activity}`. Agora é `PATCH` com o formato acima; a janela de preferências da tela Notificações usa o mesmo formulário.

### Privacidade e segurança

- Senha: `PUT /me/password { currentPassword, newPassword }` → 204; **403** `WRONG_PASSWORD` se a atual estiver errada.
- Sessões: `GET /me/sessions` → `{ items: [{ id, device, place, lastSeenAt, current }] }` · `DELETE /me/sessions/{id}` · `DELETE /me/sessions?except=current` ("Sair de todos os outros") · `POST /auth/logout { all?: boolean }` (`all:true` encerra também a atual).
- Histórico de buscas: `GET /me/search-history` → `{ count, days: 90 }` · `DELETE /me/search-history` (apaga tudo; também limpa o autocomplete).
- `keepSearchHistory:false` (via `PATCH /me`) para de gravar buscas.
- Exportar: `POST /me/export` → `{ requestedAt, deliveryDays: 15 }`; o arquivo vai por e-mail em até 15 dias. Sem download direto.
- Excluir: `POST /me/deletion { password, reason? }` → `{ scheduledFor }` (hoje + 30 dias); **403** `WRONG_PASSWORD` se a senha estiver errada. `reason` é um dos 6 textos da tela (opcional). Encerra a sessão. `DELETE /me/deletion` cancela; entrar de novo dentro do prazo cancela sozinho (`deletionCancelled:true` no login, já em `auth.md`). `deletionScheduledFor` aparece no perfil enquanto agendada.

### Configurações

Tudo em `PATCH /me` (`settings`). O front também guarda `whatsappOpen` no navegador (`encontrae_whatsapp`) para montar os links sem esperar o servidor. Tema e idioma ficam só no navegador (idioma: só pt-BR).

## Central de Ajuda (aberta a visitantes)

- `GET /help/faq` →

```json
{
  "categories": [{ "id": "conta", "name": "Minha conta", "count": 6 }],
  "items": [{ "id": "…", "categoryId": "conta", "question": "…", "answer": "…" }],
  "channels": { "chat": "Seg–sáb, 8h–20h", "email": "Resposta em 1 dia útil", "whatsapp": "Seg–sex, 8h–18h" }
}
```

  Os textos (inclusive horários) são do servidor — o front não escreve conteúdo de ajuda.
- `POST /help/faq/{id}/feedback { helpful: true }` → 204 (um voto por pessoa/sessão; repetir não soma). `{ helpful:false, comment }` → `{ protocol }`.
- `POST /help/contact { subject, message, replyEmail, imageKey? }` → `{ protocol: "EN-12345" }`. `subject` é um dos 5 assuntos da tela; `message` 10–1000; `imageKey` vem de `POST /uploads/presign` com `purpose:"help"` (**novo valor**, além de `chat` e `review`).

## Institucional (aberto a visitantes)

- `GET /legal/{doc}` com `doc` ∈ `sobre | termos | privacidade | cookies | avaliacoes` → `{ doc, title, version, updatedAt, sections: [{ heading, body }] }` (`body` em texto simples, parágrafos separados por linha em branco). **404** se não existir. `denunciar` é a tela `/denunciar`.
- O texto jurídico precisa de revisão jurídica antes de publicar (pendência externa).
- `GET /legal` (índice `{ items: [{ doc, title }] }`) está previsto mas o front usa a lista fixa acima.

## Denunciar (aberto a visitantes; com sessão, vincula à conta)

- `GET /reports/target?type=loja|produto|prestador|avaliacao&id={slug|id}` → `{ name }` (para preencher o nome). Pode falhar sem problema: a pessoa digita.
- `POST /reports { type: "loja"|"produto"|"avaliacao"|"story"|"prestador"|"outro", targetId: string|null, targetName: string|null, reason, description }` → `{ protocol: "DN-12345" }`. `reason` ∈ Golpe ou fraude · Preço ou oferta enganosa · Produto proibido · Conteúdo ofensivo · Informação falsa · Outro. `description` 10–1000. Opcional: `attachmentKey` (chave de uma imagem JPG/PNG de até 5 MB enviada antes por `POST /uploads/presign` com `purpose: "help"`; é o "Anexar print" do protótipo). O denunciado **nunca** vê quem denunciou. Prazo de análise: 48 h.

## Sistema

- `GET /status` (aberto) → `{ state: "ok"|"maintenance", until?: string|null, message?: string|null }`. Usado para detectar a volta da conexão e o fim da manutenção (consulta a cada 10 s só enquanto a faixa/tela está visível).
- Em manutenção o servidor responde **503** com `{ code: "MAINTENANCE" }` nas demais rotas; o front mostra "Voltamos em instantes".
- `POST /status/notify { email? }` → 204 ("Me avise quando voltar"; usa o e-mail da sessão se houver).
