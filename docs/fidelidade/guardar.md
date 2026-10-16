# Fidelidade ao protótipo — fluxo "guardar"

Comparação feita em 15/10/2026 contra `/tmp/claude-0/proto/*.dc.html`, com captura em 1440 px e 390 px (servidor de teste isolado, sem a API real). Dados do protótipo não foram copiados: tudo vem da API; sem dado, aparece estado estruturado.

| Artboard | Rota | Arquivo principal |
|---|---|---|
| Conversas | `/conversas`, `/conversas/[id]` | `src/components/chat/conversations-view.tsx` |
| Notificacoes | `/notificacoes` (inclui "Gerenciar alertas" e Preferências) | `notifications/notifications-view.tsx`, `notifications/prefs-dialog.tsx`, `alerts/alerts-panel.tsx` |
| Favoritos | `/favoritos` (`?aba=itens\|lojas\|listas\|alertas`) | `favorites/favorites-view.tsx` |
| Atividade | `/atividade` (`?aba=orcamentos\|promocao\|avaliacoes\|cupons\|vistos`) | `activity/activity-view.tsx` |

Componentes novos reutilizáveis: `ui/pill-tabs.tsx` (abas em pílula com contador e teclado), `ui/empty-card.tsx` (vazio no formato do protótipo).

## O que foi igualado

- **Conversas:** cartão único de 720 px com lista de 380 px + conversa; avatar redondo, hora da lista (hoje HH:mm, "ontem", dia da semana, dd/MM — `listTimeLabel`, testada), menu ⋮ com ícones, caixas de Bloquear/Apagar/Denunciar (denúncia em duas etapas; bloqueio opcional ao concluir).
- **Notificações:** largura 1040 px, ícones e selos por tipo, abas, pílula "Gerenciar alertas (N)", grupos por dia, janela de Preferências (500 px, interruptores, canais, silêncio 22h–8h).
- **Favoritos:** título 32 px, quatro atalhos (ícone, título, subtítulo, seta), abas em pílula com selo de contagem, barra branca "Mostrar / Ordenar", grade de 4 colunas por largura do bloco, cartão com coração, o que mudou, "Salvo há…" e "+ Lista"; Lojas (cartão com Seguindo ✓, novidade, Ver loja, Conversar), Listas (mosaico 2×2, "Nova lista" tracejada, Compartilhar), Alertas (faixa amarela + "Ver avisos recebidos ›").
- **Atividade:** título 32 px, abas em pílula, cartões de 16 px de raio com avatar de iniciais, faixa de valor/nota, selos de status, botões na ordem do protótipo (Ver perfil, Abrir conversa, Aceitar, Cancelar em vermelho, Avaliar em amarelo); "Quero em promoção" com faixa amarela e "+ Novo pedido", contagens e caixa verde "ENCONTRAMOS"; avaliações com resposta em citação; cupons em bilhete (código em azul, borda tracejada); vistos em grade 4 colunas com "Limpar histórico" em vermelho.
- Cores só por papel (tokens). Corrigidas as classes inexistentes `bg-success-bg`, `bg-info-bg`, `bg-danger-bg` nos selos de status.

## O que continua diferente, e por quê

| Diferença | Motivo |
|---|---|
| Largura útil, menu lateral aberto, posição do aviso (toast) e cabeçalho | Pertencem ao shell (outros agentes). |
| Janelas (Modal) sem ícone acima do título | Modal compartilhado, não editado. |
| "Salvar na lista" com caixas de marcação por lista | A API não informa a que listas um item já pertence; mantida a janela "Salvar na lista" + chip "Em N listas". |
| Avatares em azul-marinho | A API não envia cor por loja. |
| Indicador "digitando…" e "Simular aviso" | Eram recursos de demonstração do protótipo. |
| Extras mantidos: busca nos Favoritos, Alertas e Atividade; filtros de orçamentos | Já existiam e não contradizem o protótipo. |
| Atalho "Comparação de …" usa a seleção deste navegador | O protótipo mostrava uma comparação fixa. |

## Depende do back-end

`/me/favorites` (com `change`, `savedAt`, `listCount`, contagens), `/me/following` (`news`), `/me/lists` e `/share/lists`, `/me/comparisons`, `/me/alerts`, `/notifications` e `/me/notification-prefs`, `/conversations…`, `/me/quotes`, `/me/wants`, `/me/reviews`, `/me/coupons`, `/me/activity/summary`, `/recent`. Nenhum contrato novo foi criado.

## Verificação

`tsc --noEmit`, `eslint src` e `vitest run` (155 testes) sem erros; capturas em 1440 e 390 sem rolagem horizontal e sem erros de código no console (um aviso de hidratação vem do cabeçalho, fora deste fluxo). Não validado com a API real.
