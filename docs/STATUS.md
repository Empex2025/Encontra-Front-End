# Matriz de estado — front-end do consumidor

Atualizada a cada entrega. Estados: **Pendente** · **Em implementação** · **Implementado** (código pronto, conferido com build/lint/tipos) · **Validado** (testado de ponta a ponta com a API real) · **Bloqueado** (depende de algo externo).

Fonte das telas e regras: Documento de entrega EncontraÊ – consumidor. Fases: `docs/DIRETRIZES.md` §13. O que falta, por fluxo e com o motivo: `docs/PENDENCIAS.md`.

> **Situação do back-end (14/10/2026):** o repositório do back-end já tem código (NestJS, cerca de 220 rotas sob `/api/v1`), mas só 11 de 69 grupos de rotas do front coincidem em método e caminho; veja `docs/RECONCILIACAO-API.md`. Nada foi testado contra ele, então **nada pode ser "Validado"** ainda.

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
| Home: faixa de Stories | Implementado (tipos, lint, testes e navegador contra servidor de teste; **não** validado com a API real). Contrato em `docs/contratos/descobrir.md` | `GET /stories?preview=1` |
| Home: Meu Radar e Radar do bairro (preços, mais procurados, lugares) | Implementado (tipos, lint, testes e navegador contra servidor de teste, desktop e celular; **não** validado com a API real). Contrato em `docs/contratos/radar.md` | `GET /me/radar`, `POST /me/radar/seen`, `GET /discovery/trending`, `GET /discovery/prices` |
| Home: mapa de resultados | Bloqueado | Escolha do serviço de mapas |
| Produto: detalhes, preço, disponibilidade, quantidade, mensagem pronta, Avise-me, contato, comparar, cupom, avaliações | Implementado (tipos, lint, 46 testes, build e navegador contra servidor de teste isolado; **não** validado com a API real). Contrato em `docs/contratos/decidir.md` | `GET /products/{slug}`, `/related`, `/reviews` |
| Perfil da loja (fotos, produtos, ofertas, avaliações, sobre) | Implementado (idem; **não** validado com a API real) | `GET /profiles/{slug}` e sub-rotas |
| Perfil do prestador e pedido de orçamento | Implementado (idem) | `GET /profiles/{slug}`, `POST /quotes` |
| Contato: chat, WhatsApp, rota | Implementado (idem) | dados do perfil + `POST /conversations`, `POST /tracking` |
| Entrada: boas-vindas, entrar, cadastro em 4 etapas (CPF, código por SMS, local, interesses), recuperar senha, visitante (faixa, convite para entrar, áreas que pedem conta) | Implementado (conferido com tipos, lint, 21 testes, build e navegador contra servidor de teste isolado; **não** validado com a API real). Contrato em `docs/contratos/auth.md`. Retomada da ação pendente após o login: funciona em quase todas as ações (exceções em `docs/PENDENCIAS.md`) | `/auth/*`, `PUT /me/location`, `POST /me/addresses`, `GET /geo/*`, `PUT /me/interests`, provedor de SMS |

## Fase 2 — Confiar

| Tela / funcionalidade | Estado | Depende de |
|---|---|---|
| Avaliações (ler, filtrar, "útil") | Implementado (tipos, lint, testes e navegador contra servidor de teste; **não** validado com a API real) | `GET /…/reviews`, `POST /reviews/{id}/helpful` |
| Avaliar (fotos, vídeo, checagem, rascunho) | Implementado (idem). Contrato em `docs/contratos/acompanhar.md` | `GET /review-targets/…`, `POST /reviews`, `POST /uploads/presign` |
| Sinais de confiança (verificado, atualizado em, disponibilidade informada) | Pendente | campos no perfil e na oferta |
| Denunciar | Implementado (tipos, lint, testes e navegador contra servidor de teste; **não** validado com a API real). Contrato em `docs/contratos/conta.md` | `GET /reports/target`, `POST /reports` |

## Fase 3 — Descobrir

| Tela / funcionalidade | Estado | Depende de |
|---|---|---|
| Ofertas & Promoções, cupons | Implementado (idem) | `GET /offers`, `POST /coupons/{id}/claim` |
| Comparar: quadro lado a lado (até 3 itens escolhidos pelo usuário, prioridades, "só o que é diferente") e botão "Comparar" nos cards | Implementado (conferido com tipos, lint, build, 11 testes da lógica e navegador contra servidor de teste isolado; **não** validado com a API real). Contrato em `docs/contratos/comparar.md`; a lista de itens fica no navegador | `GET /comparisons/view`, campo `group` nos itens da busca |
| Comparar: pesquisa e bandeja "Sua comparação" | Implementado (idem) | `GET /search`; mapa depende do serviço de mapas |
| Favoritos, listas, seguir; comparações salvas na conta; página pública de lista compartilhada (`/listas/{token}`) | Implementado (idem). Contratos em `docs/contratos/comparacoes-salvas.md` e `lista-publica.md` | `/me/favorites`, `/me/following`, `/me/lists`, `/me/comparisons`, `GET /share/lists/{token}`, `/profiles/{id}/follow` |
| Alertas ("Avise-me", gestão) e "Quero em promoção" (Atividade) | Implementado (idem) | `/me/alerts`, `/me/wants` |
| Stories (visualizador), Ao vivo (chat por consulta periódica) e Evento | Implementado (idem). Socket.IO e streaming de vídeo dependem do back-end/serviço | `/stories`, `/lives`, `/happenings` |
| Compartilhado: página pública `/o/{slug}` (oferta) e prévia de links no servidor em `/p`, `/l`, `/s`, `/o` (Open Graph, JSON-LD, 404 real) | Implementado (tipos, lint, testes, build e navegador contra servidor de teste; **não** validado com a API real). Contrato em `docs/contratos/oferta.md`. Faltam `sitemap.xml`/`robots.txt` (dependem do back-end) | `GET /offers/{slug}`, rotas públicas sem sessão, `NEXT_PUBLIC_SITE_URL` |

## Contato e conta (transversal)

| Tela / funcionalidade | Estado | Depende de |
|---|---|---|
| Conversas (chat próprio: lista, conversa, foto, silenciar, bloquear, denunciar, apagar) | Implementado (idem; atualização por consulta periódica, sem Socket.IO) | `/conversations…`, `/uploads/presign` |
| Notificações e preferências | Implementado (idem) | `/notifications…`, `/me/notification-prefs` |
| Minha atividade | Implementado (idem) | `/me/quotes`, `/me/wants`, `/me/reviews`, `/me/coupons`, `/me/activity/summary`, `/recent` |
| Minha Conta (perfil, endereços, interesses, notificações, privacidade e segurança, excluir conta, configurações, sair) | Implementado (conferido com tipos, lint, 83 testes, build e navegador contra servidor de teste isolado, desktop e celular; **não** validado com a API real). Contrato em `docs/contratos/conta.md` | `/me/profile`, `PATCH /me`, `/me/addresses`, `/me/interests`, `/me/notification-prefs`, `/me/sessions`, `/me/search-history`, `/me/export`, `/me/deletion`, `/auth/logout` |
| Ajuda (FAQ, fale conosco) e Institucional (sobre, termos, privacidade, cookies com controles reais, avaliações) | Implementado (idem). Textos jurídicos e de ajuda vêm da API; nada fixo no código | `GET /help/faq`, `POST /help/contact`, `GET /legal/{doc}` |
| Telas de sistema (404 com sugestões, erro 500, faixa sem internet, manutenção, limite de 8 s nas leituras, "Oferta encerrada") | Implementado (idem) | `GET /status`, `POST /status/notify` |

## Fase 4 — Inteligência

Fora do escopo do app do consumidor por enquanto. O registro de eventos (acima) é a base.

## Pendências externas

1. Back-end publicar as rotas `/api/v1` na ordem das fases do "Pedido ao back-end".
2. Escolher o serviço de mapas (bloqueia o mapa do Explorar e a rota no mapa).
3. Contas de serviços: SMS, e-mail, armazenamento de fotos, hospedagem.
4. Revisão jurídica: termos, privacidade, prazos da LGPD.
5. Logo em vetor (SVG).
6. Serviço de streaming (HLS) e Socket.IO (tempo real).
7. `NEXT_PUBLIC_SITE_URL` e lista de URLs públicas para `sitemap.xml`.
