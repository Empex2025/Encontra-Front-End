# Matriz de estado — front-end do consumidor

Atualizada a cada entrega. Estados: **Pendente** · **Em implementação** · **Implementado** (código pronto, conferido com build/lint/tipos) · **Validado** (testado de ponta a ponta com a API real) · **Bloqueado** (depende de algo externo).

Fonte das telas e regras: Documento de entrega EncontraÊ – consumidor. Fases: `docs/DIRETRIZES.md` §13.

> **Situação do back-end (09/10/2026):** o contrato `/api/v1` está descrito na aba "Pedido ao back-end". Nenhuma rota `/api/v1` foi publicada ainda, então **nada pode ser "Validado"** por enquanto. Este repositório não tem acesso ao repositório do back-end; a última leitura dele é de 30/09/2026.

## Base (estrutura global)

| Item | Fase | Estado | Depende de |
|---|---|---|---|
| Tokens do Design System (claro/escuro), fontes, CAT12, escala de raio | — | Implementado | — |
| Cabeçalho: local + raio, busca com histórico | 1 | Implementado | `GET/PUT /me/location`, `GET /search/autocomplete` |
| Menu lateral com contadores, barra inferior no celular, rodapé | — | Implementado | `GET /notifications/unread-count` |
| Modo escuro sem piscar, "Pular para o conteúdo" | — | Implementado | — |
| Cliente da API com validação (Zod) e erro padronizado | — | Implementado | — |
| Registro de eventos (`src/lib/analytics/track.ts`): nomes, sessão, sem duplicar visualizações | 1 | Implementado | `POST /tracking` |

## Fase 1 — Encontrar

| Tela / funcionalidade | Estado | Depende de |
|---|---|---|
| Explorar: busca, resultados, filtros, ordenação, ampliar raio | Implementado (conferido com tipos, lint, build e navegador contra um servidor de teste isolado; **não** validado com a API real). Contrato proposto em `docs/contratos/busca.md` | `GET /search`, `GET /discovery/nearby` (+ contagens dos filtros), `POST /me/wants` |
| Explorar: mapa | Bloqueado | Escolha do serviço de mapas; `GET /map` |
| Home: busca em destaque e descoberta próxima | Pendente | `GET /discovery/home` |
| Produto: detalhes, preço, disponibilidade, contato, rota | Pendente | `GET /products/{id}`, `GET /products/{id}/offers` |
| Perfil da loja | Pendente | `GET /profiles/{slug}` e sub-rotas |
| Perfil do prestador e pedido de orçamento | Pendente | `GET /profiles/{slug}`, `GET /services/{id}`, `POST /quotes` |
| Contato: WhatsApp, telefone, rota | Pendente | dados do perfil + `POST /tracking` |
| Entrada: entrar, cadastro (CPF, SMS, local, interesses), recuperar senha, visitante | Pendente | `/auth/*`, provedor de SMS |

## Fase 2 — Confiar

| Tela / funcionalidade | Estado | Depende de |
|---|---|---|
| Avaliações (ler, filtrar, "útil") | Pendente | `GET /…/reviews`, `POST /reviews/{id}/helpful` |
| Avaliar (fotos, vídeo, checagem) | Pendente | `POST /reviews`, `POST /uploads/presign` |
| Sinais de confiança (verificado, atualizado em, disponibilidade informada) | Pendente | campos no perfil e na oferta |
| Denunciar | Pendente | `POST /reports` |

## Fase 3 — Descobrir

| Tela / funcionalidade | Estado | Depende de |
|---|---|---|
| Ofertas & Promoções, cupons | Pendente | `GET /offers`, `GET /coupons`, `POST /coupons/{id}/claim` |
| Comparar (seleção e lado a lado) | Pendente | `/me/comparisons`, catálogo canônico |
| Favoritos, listas, seguir | Pendente | `/me/favorites`, `/me/lists`, `/profiles/{id}/follow` |
| Alertas e "Quero em promoção" | Pendente | `/me/alerts`, `/me/wants` |
| Stories, Ao vivo, Evento | Pendente | `/stories`, `/lives`, `/happenings` + Socket.IO |
| Compartilhar e página pública com prévia | Pendente | `GET /share/{type}/{id}` |

## Contato e conta (transversal)

| Tela / funcionalidade | Estado | Depende de |
|---|---|---|
| Conversas (chat próprio) | Pendente | `/conversations`, Socket.IO |
| Notificações e preferências | Pendente | `/notifications`, `/me/notification-prefs` |
| Minha atividade | Pendente | `/quotes`, `/me/wants`, `/me/reviews`, `/me/coupons`, `/me/activity` |
| Minha Conta (perfil, endereços, interesses, sessões, LGPD) | Pendente | `/me/*` |
| Ajuda, Institucional | Pendente | `/help/*`, `/legal/{doc}` |
| Telas de sistema (404, erro, sem internet, manutenção) | Pendente | `GET /status` |

## Fase 4 — Inteligência

Fora do escopo do app do consumidor por enquanto. O registro de eventos (acima) é a base.

## Pendências externas

1. Back-end publicar as rotas `/api/v1` na ordem das fases do "Pedido ao back-end".
2. Escolher o serviço de mapas (bloqueia o mapa do Explorar e a rota no mapa).
3. Contas de serviços: SMS, e-mail, armazenamento de fotos, hospedagem.
4. Revisão jurídica: termos, privacidade, prazos da LGPD.
5. Logo em vetor (SVG).
