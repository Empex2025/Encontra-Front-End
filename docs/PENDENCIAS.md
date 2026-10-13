# Pendências por fluxo

Registro do que **não foi feito, não foi testado ou depende de terceiros**, organizado pelos fluxos do Documento de entrega. Atualizado a cada entrega, junto com `docs/STATUS.md`. A matriz de estado diz _em que pé está_; este arquivo diz _o que falta e por quê_.

Legenda do motivo: **API** = depende de rota `/api/v1` ainda não publicada · **Externo** = depende de serviço, conta ou decisão fora do código · **Front** = falta código nosso · **Decisão** = precisa de resposta dos fundadores.

> Em todos os fluxos vale: nenhuma rota `/api/v1` existe ainda, então **nada foi validado com a API real**. Tudo "Implementado" foi conferido só com tipos, lint, testes de lógica, build e navegador contra servidores de teste descartáveis (fora do repositório).

---

## Estrutura global

| Pendência | Motivo | Detalhe |
|---|---|---|
| Atalhos de teclado do menu | Front | O Documento de entrega lista atalhos; não foram implementados. |
| Contadores do menu (conversas, notificações, favoritos) | API | Dependem de `GET /notifications/unread-count` e dos contadores em `GET /me`. Mostram zero/ocultos sem a API. |
| Logo em vetor (SVG) | Externo | Hoje usamos o PNG do símbolo (`/brand/simbolo.png`); fica serrilhado em telas grandes. |
| Fonte do cabeçalho em larguras entre 640 e 1024 px | Front | Corrigido neste PR: a busca do cabeçalho some abaixo de 1024 px e vira ícone. Falta conferir em aparelhos reais (só testado em 800 e 1000 px no Chromium). |
| Testes automáticos de interface | Front | Só há testes da lógica (21 testes). Os passos de navegador foram feitos à mão com scripts descartáveis, não estão no repositório nem rodam em CI. |

## Fluxo 1 · Entrada

Código pronto (PR #4), não validado com a API real.

| Pendência | Motivo | Detalhe |
|---|---|---|
| Retomar a ação pendente depois do login | Front | A infraestrutura existe (`savePendingAction` / `takePendingAction`). **Só "Quero em promoção" retoma** (reabre o pedido, sem enviar sozinho). Favoritar, seguir, conversar, avaliar, alerta, cupom, orçamento, salvar comparação, reservar, curtir, útil, comentar, confirmar presença, interesse e lembrete retomam quando cada tela existir. Cada tela nova deve chamar `takePendingAction("tipo")` ao montar. |
| Voltar do navegador no cadastro | Front | O cadastro é uma rota só (`/cadastro`, documento ajustado em 12/10); o botão voltar do navegador sai do cadastro em vez de voltar uma etapa. |
| Código por SMS de verdade | Externo | Precisa de provedor de SMS contratado e configurado no back-end. No teste, o código "123456" era do servidor de teste. |
| Recuperar senha por e-mail | Externo | Precisa de serviço de e-mail. A tela oferece o canal; o envio é do back-end. |
| Bloqueios e limites (5 erros, 15 min, 60 s de reenvio, tentativas de login) | API | A tela só exibe o que o servidor responder. A regra em si ainda não foi testada de verdade. |
| Cookie de sessão entre domínios | Externo | O contrato supõe front e API no mesmo domínio (reescrita `/api/v1`). Se a hospedagem separar, é preciso revisar `SameSite` e CORS. |
| Termos e Privacidade (aceite com versão) | Externo | O link existe; o texto depende da revisão jurídica. O servidor precisa guardar versão e data do aceite. |
| "Exclusão agendada cancelada" no login | API | Exibida só se o servidor mandar `deletionCancelled: true`. O fluxo de excluir conta está no Fluxo 5. |
| Acessibilidade com leitor de tela | Front | Caixas do código têm rótulo ("Dígito 1 de 6") e erros são anunciados, mas não foi testado com leitor de tela real. |
| Login com Google/Apple | Decisão | Fora da 1ª versão (decisão 7). |

## Fluxo 2 · Descobrir

| Tela | Estado | Pendência |
|---|---|---|
| Explorar (lista, filtros, ordenação, ampliar raio) | Implementado, não validado | Contrato proposto em `docs/contratos/busca.md`; `GET /search`, `GET /discovery/nearby` (+ contagens dos filtros) e `POST /me/wants` (API). Nome do bairro a partir do GPS depende de `GET /geo/reverse` (API; o seletor de local ainda mostra "Minha localização atual"). |
| Explorar: mapa | Bloqueado | **Decisão/Externo:** escolher o serviço de mapas (custo, chave de API, termos). Depois, `GET /map`. |
| Quero em promoção | Implementado, não validado | Corrigido neste PR: o link de login perdia o retorno (parâmetro errado). Agora volta e reabre o pedido. Falta `POST /me/wants` real e "Ver meus pedidos" (Atividade, Fluxo 4). |
| Home (busca, atalhos, categorias, blocos de descoberta, cookies) | Implementado, não validado | Contrato em `docs/contratos/home.md`; `GET /discovery/home` e `GET /search/autocomplete` (API). Blocos vazios ficam ocultos. |
| Home: Stories | Pendente | `GET /stories?preview=1`, `POST /stories/{id}/view`; precisa da tela de Stories. Ordem: seguidos primeiro, depois até 6 não seguidos. |
| Home: Meu Radar | Pendente | `GET /me/radar`, `POST /me/radar/seen`; depende de alertas e seguir (Fluxo 4). Visitante: convite para criar conta. |
| Home: Radar do bairro (preços, mais procurados, lugares) | Pendente | `GET /discovery/prices`, `GET /discovery/trending`. Só mostrar com base de cálculo real (DIRETRIZES §9). |
| Home: mapa de resultados | Bloqueado | Serviço de mapas (ver Explorar: mapa). |
| Home: abas dentro dos blocos (Ao vivo / Vídeos / Menor preço; Esporte / Moda…; Disponível hoje…) | Decisão | Não feitas: cada bloco mostra até 6 itens e "Ver todos" abre o Explorar com o filtro. Evita duplicar o Explorar; reavaliar com dados reais. |
| Home: carrossel com setas e "1–6 de 12" | Front | Hoje é rolagem horizontal nativa. Setas só se houver necessidade. |
| Home: vídeos nos cards de Experiências | Externo | Prototipo não tocava vídeo; depende de armazenamento/streaming de mídia. |
| Aviso de cookies: página `/institucional/cookies` | Externo | O link "Personalizar ou ler a política" existe; o texto depende da revisão jurídica. |
| Aviso de cookies: efeito real | Decisão | Hoje "Só os necessários" **para de enviar eventos de uso**; antes de qualquer escolha os eventos continuam sendo enviados. Se preferir o padrão mais restrito (nada enviado até aceitar), é uma linha em `track()`, mas reduz os dados de demanda de visitantes novos. |
| Stories, Ao vivo, Evento | Pendente | `/stories`, `/lives`, `/happenings` e Socket.IO (API). Hoje `/ao-vivo/{id}` é página provisória. |
| Raio inicial do protótipo | Decisão | O protótipo ainda começa em 5 km; o código usa 50 km (decisão 8). Atualizar o protótipo. |

## Fluxo 3 · Decidir

| Tela | Estado | Pendência |
|---|---|---|
| Comparar (lado a lado) | Implementado, não validado | `GET /comparisons/view` e o campo `group` nos itens da busca (API). Contrato em `docs/contratos/comparar.md`. A lista fica no navegador. |
| Comparar (seleção: pesquisa e bandeja "Sua comparação") | Pendente | Front. Hoje só dá para adicionar pelo botão "Comparar" dos cards. |
| "Salvar comparação" na conta | Decisão | O convite existe (`saveComparison`), mas a decisão 5 revisada diz que a lista fica só no navegador. Decidir se haverá salvar em Favoritos; se sim, vira rota nova. |
| Produto | Pendente | `GET /products/{id}`, `GET /products/{id}/offers`. Hoje `/p/{slug}` é página provisória. |
| Perfil da loja | Pendente | `GET /profiles/{slug}` e sub-rotas. `/l/{slug}` provisória. |
| Perfil do prestador e pedido de orçamento | Pendente | `GET /services/{id}`, `POST /quotes`. `/s/{slug}` provisória. |
| Ofertas, cupom e card de oferta | Pendente | `GET /offers`, `GET /coupons`, `POST /coupons/{id}/claim`. O card de oferta ainda não existe como componente. |
| Contato: WhatsApp, telefone, rota | Pendente | Dados do perfil + `POST /tracking`. Rota no mapa depende da escolha do serviço de mapas. |

## Fluxo 4 · Contato e acompanhamento

Tudo pendente.

| Tela | Pendência |
|---|---|
| Conversas (chat próprio) | API `/conversations` + Socket.IO. Hoje a tela só mostra o bloqueio de visitante. |
| Notificações e preferências | API `/notifications`, `/me/notification-prefs`. Web push/e-mail: serviço externo. |
| Favoritos, listas, seguir | API `/me/favorites`, `/me/lists`, `/profiles/{id}/follow`. Retomar a ação pendente (ver Fluxo 1). |
| Alertas | API `/me/alerts`. Não prometer monitoramento de preço ou estoque sem fonte confiável (DIRETRIZES §11). |
| Atividade | API `/quotes`, `/me/wants`, `/me/reviews`, `/me/coupons`, `/me/activity`. |
| Avaliar (fotos, vídeo) | API `POST /reviews`, `POST /uploads/presign`; **Externo:** armazenamento de arquivos. |
| Compartilhar e página pública com prévia | API `GET /share/{type}/{id}`; SEO e prévia exigem renderização no servidor. |

## Fluxo 5 · Conta, suporte e sistema

Tudo pendente.

| Tela | Pendência |
|---|---|
| Minha Conta (perfil, endereços, interesses, sessões, LGPD, excluir conta) | API `/me/*`. Prazos da LGPD: **Externo** (revisão jurídica). |
| Central de Ajuda, Institucional | API `/help/*`, `/legal/{doc}`; textos jurídicos dependem de revisão. |
| Denunciar | API `POST /reports`. |
| Telas de sistema (404, erro, sem internet, manutenção, oferta encerrada) | Front, parte depende de `GET /status`. |
| Área do lojista | Fora do escopo do app do consumidor (aparece "em breve" no rodapé). |

---

## Pendências externas (resumo)

1. Back-end publicar `/api/v1` na ordem das fases do "Pedido ao back-end" (inclui a seção 11, de entrada).
2. Escolher o serviço de mapas.
3. Contas: SMS, e-mail, armazenamento de fotos, hospedagem.
4. Revisão jurídica: termos, privacidade, prazos da LGPD.
5. Logo em vetor (SVG).
6. Confirmar que o repositório do back-end (`plataforma-`) é privado.
