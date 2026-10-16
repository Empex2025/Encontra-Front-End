# Contrato — Entrada: login, cadastro, código por SMS e recuperar senha

Proposta do front para combinar com o back-end. Base: Fluxo 1 do Documento de entrega e as decisões de 08/10 (CPF obrigatório; sem login Google/Apple na 1ª versão; só e-mail/CPF + senha e código por SMS).

## Convenções

- Sessão por **cookie** `HttpOnly`, `Secure`, `SameSite=Lax` no mesmo domínio (o front repassa `/api/v1` ao back). O front nunca lê nem guarda token.
- "Manter conectado" (`keepSignedIn`) = sessão de 30 dias neste aparelho; desmarcado = sessão curta (fecha com o navegador).
- Erros no formato padrão `{ code, message, fields? }`. O `message` já vem em português, pronto para mostrar.
- O front só guarda no navegador a lista de ações pendentes de visitante (sem dados pessoais) e, durante o cadastro, nada além do que está na tela.
- Limites e bloqueios (5 erros de código, bloqueio de 15 min, reenvio após 60 s, tentativas de login) **são do servidor**; o front só exibe.

## Login

`POST /auth/login` — `{ "login": "CPF ou e-mail", "password": "…", "keepSignedIn": true }`

Aceita CPF com ou sem máscara, ou e-mail. Resposta 200: `{ "user": Me, "deletionCancelled": boolean }`. `deletionCancelled: true` quando a conta tinha exclusão agendada e o login a cancelou (o front mostra "Exclusão cancelada. Que bom ter você de volta!").

| Status | `code`                | Quando                                                         |
| ------ | --------------------- | -------------------------------------------------------------- |
| 401    | `INVALID_CREDENTIALS` | login ou senha errados (mesma resposta para conta inexistente) |
| 423    | `ACCOUNT_LOCKED`      | bloqueio temporário; `retryAfterSeconds` opcional              |
| 429    | `TOO_MANY_ATTEMPTS`   | limite de tentativas; `retryAfterSeconds`                      |

`GET /me` (já existente) devolve o usuário logado ou 401 para visitante.

## Cadastro (4 etapas)

1. `POST /auth/register` — `{ name, cpf, email, phone, password, acceptTerms: true }`. CPF e telefone **só números**. `acceptTerms: true` faz o servidor guardar a versão atual dos Termos e da Privacidade e a data. Cria a conta **pendente** e envia o SMS. Resposta 201: `OtpChallenge` (abaixo).
   Erros 409/422 com `fields`: `EMAIL_TAKEN`, `CPF_TAKEN`, `PHONE_TAKEN`, `CPF_INVALID` (dígito verificador), `WEAK_PASSWORD`.
   Voltar da etapa 2 para a 1 e reenviar os mesmos dados (mesmo e-mail, CPF e telefone de uma conta ainda **pendente**) não dá `*_TAKEN`: o servidor atualiza a conta pendente e reenvia o código.
2. `POST /auth/otp/verify` — `{ challengeId, code }`. Certo: ativa a conta, abre a sessão (cookie) e devolve `{ "user": Me }`.
3. `PUT /me/location` (já existente) e `POST /me/addresses` — `{ cep, street, neighborhood, city, state, lat, lng, main: true }`. Auxiliares: `GET /geo/cep/{cep}` → `{ street, neighborhood, city, state, lat, lng }` (404 `CEP_NOT_FOUND`) e `GET /geo/reverse?lat=&lng=` → `{ street, neighborhood, city, state, cep }`.
4. `PUT /me/interests` — `{ categoryIds: ["comida", …] }`, mínimo 3, ids das 12 categorias (422 `INTERESTS_MIN`).

Raio inicial 50 km (escala única 1, 3, 5, 10, 20, 50).

## Código por SMS (cadastro e recuperar senha)

`OtpChallenge`:

```json
{
  "challengeId": "…",
  "channel": "sms",
  "destinationMasked": "(82) 9 ••••-5432",
  "expiresAt": "2026-10-12T21:00:00Z",
  "resendAt": "2026-10-12T20:56:00Z"
}
```

- `POST /auth/otp/verify` `{ challengeId, code }`. Erros: 422 `OTP_INVALID` com `fields.attemptsLeft`; 410 `OTP_EXPIRED`; 429 `OTP_LOCKED` com `fields.retryAfterSeconds` (bloqueio de 15 min após o 5º erro). Os números vão em `fields`, como texto.
- `POST /auth/otp/resend` `{ challengeId, channel? }` → novo `OtpChallenge`. Recusa antes de 60 s com 429 `OTP_RESEND_TOO_SOON` (`fields.retryAfterSeconds`) e durante o bloqueio. Reenviar **não zera** as tentativas erradas. Trocar `channel` (sms/e-mail, só na recuperação) também respeita os 60 s.
- Código de 6 dígitos, validade de 5 minutos.

## Recuperar senha

1. `POST /auth/password/channels` — `{ login }` → `{ channels: [{ channel: "sms", destinationMasked }, { channel: "email", destinationMasked }] }`. **Não pode revelar se a conta existe**: para login desconhecido devolve a mesma forma, com máscaras genéricas.
2. `POST /auth/password/forgot` — `{ login, channel }` → `OtpChallenge`.
3. `POST /auth/otp/verify` `{ challengeId, code }` → `{ resetToken }` (uso único, curto).
4. `POST /auth/password/reset` — `{ resetToken, newPassword, signOutOtherDevices }` → 204. Regras da senha: 8 a 64 caracteres, letras e números, diferente da atual. O front **não** loga automaticamente depois.

## Regras de senha (iguais no cadastro e na redefinição)

8 a 64 caracteres, com letras e números. O servidor valida de novo.

## Ações pendentes do visitante

O convite de login (título e texto por ação) é do front. Ao entrar ou criar conta, o front volta à tela de origem e a própria tela repete a chamada da ação (favoritar, seguir, conversar, avaliar, alerta, cupom, orçamento, quero em promoção…). Nenhuma rota nova para isso; as rotas protegidas respondem 401 sem sessão.

## Retorno após entrar (`?voltar=`)

`/entrar`, `/entrar/recuperar`, `/cadastro` e `/boas-vindas` aceitam `?voltar=<caminho interno>` (validado por `safeReturnTo`; qualquer valor externo cai em `/`). O parâmetro é repassado entre as telas; no fim do cadastro, "Começar" leva ao destino. Só o front usa; nenhuma rota nova.

## Proposta: login com Google e Apple (sem rota hoje)

O protótipo mostra os botões "Google" e "Apple" em Entrar e no convite do visitante. A decisão de produto 7 exclui o login social da versão 1 e o back-end não tem a rota; por isso o front mostra os botões desabilitados, com o aviso "Entrar com Google ou Apple ainda não está disponível.". Quando o produto aprovar, será preciso definir a rota e o fluxo (ex.: `POST /auth/social`); não está especificado aqui.
