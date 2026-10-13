# Matriz de estado — front-end do consumidor

Atualizada a cada entrega. Estados: **Pendente** · **Em implementação** · **Implementado** (código pronto, conferido com build/lint/tipos) · **Validado** (testado de ponta a ponta com a API real) · **Bloqueado** (depende de algo externo).

Fonte das telas e regras: Documento de entrega EncontraÊ – consumidor. Fases: `docs/DIRETRIZES.md` §13. O que falta, por fluxo e com o motivo: `docs/PENDENCIAS.md`.

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
| Home: busca em destaque (histórico, atalhos, buscas populares), categorias (CAT12), blocos "Acontecendo", Produtos, Serviços e Experiências perto de você (blocos vazios ficam ocultos), aviso de cookies | Implementado (conferido com tipos, lint, 25 testes, build e navegador contra servidor de teste isolado, desktop e celular; **não** validado com a API real). Contrato em `docs/contratos/home.md` | `GET /discovery/home`, `GET /search/autocomplete` |
| Home: Stories, Meu Radar, Radar do bairro (preços, mais procurados, lugares) e mapa de resultados | Pendente / mapa Bloqueado | `/stories`, `/me/radar`, `/discovery/trending`, `/discovery/prices`; serviço de mapas |
| Produto: detalhes, preço, disponibilidade, quantidade, mensagem pronta, Avise-me, contato, comparar, cupom, avaliações | Implementado (tipos, lint, 46 testes, build e navegador contra servidor de teste isolado; **não** validado com a API real). Contrato em `docs/contratos/decidir.md` | `GET /products/{slug}`, `/related`, `/reviews` |
| Perfil da loja (fotos, produtos, ofertas, avaliações, sobre) | Implementado (idem; **não** validado com a API real) | `GET /profiles/{slug}` e sub-rotas |
| Perfil do prestador e pedido de orçamento | Implementado (idem) | `GET /profiles/{slug}`, `POST /quotes` |
| Contato: chat, WhatsApp, rota | Implementado (idem) | dados do perfil + `POST /conversations`, `POST /tracking` |
| Entrada: boas-vindas, entrar, cadastro em 4 etapas (CPF, código por SMS, local, interesses), recuperar senha, visitante (faixa, convite para entrar, áreas que pedem conta) | Implementado (conferido com tipos, lint, 21 testes, build e navegador contra servidor de teste isolado; **não** validado com a API real). Contrato em `docs/contratos/auth.md`. Retomada da ação pendente após o login: só "Quero em promoção" por enquanto; as demais telas retomam quando existirem (detalhes em `docs/PENDENCIAS.md`) | `/auth/*`, `PUT /me/location`, `POST /me/addresses`, `GET /geo/*`, `PUT /me/interests`, provedor de SMS |

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
| Ofertas & Promoções, cupons | Implementado (idem) | `GET /offers`, `POST /coupons/{id}/claim` |
| Comparar: quadro lado a lado (até 3 itens escolhidos pelo usuário, prioridades, "só o que é diferente") e botão "Comparar" nos cards | Implementado (conferido com tipos, lint, build, 11 testes da lógica e navegador contra servidor de teste isolado; **não** validado com a API real). Contrato em `docs/contratos/comparar.md`; a lista de itens fica no navegador | `GET /comparisons/view`, campo `group` nos itens da busca |
| Comparar: pesquisa e bandeja "Sua comparação" | Implementado (idem) | `GET /search`; mapa depende do serviço de mapas |
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
