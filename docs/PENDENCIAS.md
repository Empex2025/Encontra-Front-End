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
| Home: faixa de Stories | Implementado, não validado | `GET /stories?preview=1` (contrato em `docs/contratos/descobrir.md`). Some se não houver stories. |
| Home: Meu Radar | Pendente | `GET /me/radar`, `POST /me/radar/seen`; depende de alertas e seguir (Fluxo 4). Visitante: convite para criar conta. |
| Home: Radar do bairro (preços, mais procurados, lugares) | Pendente | `GET /discovery/prices`, `GET /discovery/trending`. Só mostrar com base de cálculo real (DIRETRIZES §9). |
| Home: mapa de resultados | Bloqueado | Serviço de mapas (ver Explorar: mapa). |
| Home: abas dentro dos blocos (Ao vivo / Vídeos / Menor preço; Esporte / Moda…; Disponível hoje…) | Decisão | Não feitas: cada bloco mostra até 6 itens e "Ver todos" abre o Explorar com o filtro. Evita duplicar o Explorar; reavaliar com dados reais. |
| Home: carrossel com setas e "1–6 de 12" | Front | Hoje é rolagem horizontal nativa. Setas só se houver necessidade. |
| Home: vídeos nos cards de Experiências | Externo | Prototipo não tocava vídeo; depende de armazenamento/streaming de mídia. |
| Aviso de cookies: página `/institucional/cookies` | Externo | O link "Personalizar ou ler a política" existe; o texto depende da revisão jurídica. |
| Aviso de cookies: efeito real | Decisão | Hoje "Só os necessários" **para de enviar eventos de uso**; antes de qualquer escolha os eventos continuam sendo enviados. Se preferir o padrão mais restrito (nada enviado até aceitar), é uma linha em `track()`, mas reduz os dados de demanda de visitantes novos. |
| Stories (visualizador) | Implementado, não validado | `/stories`, `/stories/{id}/view|like|save`, `POST /conversations` com `firstMessage` e `origin`. **Decisão:** no fim da fila aparece "Você viu todos os stories de hoje" (o documento deixava em aberto); "Ver de novo" conta uma volta. Endereço `/stories?perfil=&destaque=&inicio=` (o documento previa `/s/{perfil}-{n}`, que aqui é o prestador). Vídeo de story toca mudo e dura os mesmos 5 s. Responder pede conta. Falta retomar a ação pendente (curtir/salvar/responder) depois do login. "Como chegar" no card "No mapa" não existe (a marcação não traz coordenadas). |
| Ao vivo | Implementado, não validado | `GET /lives/{id}`, chat por consulta a cada 3 s (`GET|POST /lives/{id}/messages`), curtir, lembrete, outras lives. **Externo:** serviço de streaming (HLS) para o vídeo tocar em todos os navegadores; sem `streamUrl` mostra a capa. **Socket.IO** não feito (consulta periódica). Corações animados respeitam "reduzir movimento". |
| Evento | Implementado, não validado | `GET /happenings/{id}`, `/attendance`, `calendar.ics`. **Decisão:** "Vou" e "Tenho interesse" são exclusivos. Mini mapa não existe (mapa bloqueado): mostra endereço e "Como chegar" (Google Maps). Aviso 1 h antes é do back-end. |
| Meu Radar (Home) | Pendente | Depende de `GET /me/radar` e da especificação detalhada; não iniciado. |
| Denunciar story/live/evento | Implementado | Tipos `story`, `live`, `evento` em `POST /reports`. |
| Raio inicial do protótipo | Decisão | O protótipo ainda começa em 5 km; o código usa 50 km (decisão 8). Atualizar o protótipo. |

## Fluxo 3 · Decidir

Código pronto (PR #6), **não validado com a API real**. Contratos: `docs/contratos/decidir.md` e `comparar.md`.

| Tela | Estado | Pendência |
|---|---|---|
| Comparar (lado a lado) | Implementado | `GET /comparisons/view` e o campo `group` nos itens da busca (API). A lista fica no navegador. |
| Comparar: pesquisa e bandeja "Sua comparação" | Implementado | Usa `GET /search`. Falta o mapa (bloqueado). |
| "Salvar comparação" na conta | Decisão | O convite existe (`saveComparison`), mas a decisão 5 diz que a lista fica só no navegador. Decidir se haverá salvar em Favoritos. |
| Produto | Implementado | `GET /products/{slug}` (+ `/related`, `/reviews`). "Ver no mapa" abre o Explorar (mapa bloqueado). Vários-lojas (`/products/{id}/offers`) não entrou: o contrato novo traz `sameLine` e `related`. |
| Perfil da loja | Implementado | `GET /profiles/{slug}` e `/products`, `/posts`, `/offers`, `/reviews`. Visualizador de fotos simples (sem curtir/comentar: depende de `POST /posts/{id}/like` e comentários, Fluxo 4). Destaques (stories) só aparecem como círculos: abrir depende da tela de Stories. |
| Perfil do prestador e orçamento | Implementado | `POST /quotes`. Mapa da área de atendimento não existe (mapa bloqueado). |
| Ofertas, cupom | Implementado | `GET /offers` (contrato novo, em `decidir.md`) e `POST /coupons/{id}/claim`. Cupons resgatados aparecem em Atividade (Fluxo 4). "Mapa (camada ofertas)" bloqueado. |
| Contato: WhatsApp, telefone, rota | Implementado | WhatsApp abre `wa.me` só se o perfil tiver número. Telefone não é exibido (o documento prevê só chat e WhatsApp). "Como chegar" abre o Google Maps no navegador (não depende de chave); trocar se for escolhido outro serviço de mapas. |
| Páginas públicas com SEO (título e prévia ao compartilhar) | Front/API | Produto, loja e prestador são renderizados no navegador. Para título, descrição, imagem de prévia e indexação é preciso buscar os dados no servidor (`BACKEND_URL` em tempo de execução) e gerar `generateMetadata`. Fica para quando a API existir. |
| Avaliar, denunciar, compartilhar (links) | Pendente | Os botões levam a `/avaliar`, `/denunciar` (Fluxos 4 e 5). |
| Retomar ação pendente (favoritar, seguir, conversar, alerta, cupom, orçamento) | Front | O convite abre e leva ao login, mas só "Quero em promoção" retoma sozinho. Falta chamar `takePendingAction` nas telas novas. |

## Fluxo 4 · Contato e acompanhamento

Código pronto (PR #7), **não validado com a API real**. Contrato: `docs/contratos/acompanhar.md`. Conferido com tipos, lint, 69 testes e navegador contra servidor de teste descartável (desktop e celular).

| Tela | Estado | Pendência |
|---|---|---|
| Favoritos (itens, lojas, listas, alertas) | Implementado | `/me/favorites`, `/me/following`, `/me/lists…`, `/me/alerts` (API). Lista compartilhada: o link abre uma página pública que **ainda não existe** (ver "Compartilhado"). Comentar numa lista compartilhada depende da página pública. O faixa "{N} lojas com novidades" depende de `news` real vinda do servidor. |
| Conversas | Implementado | `/conversations…` (API). **Tempo real não existe**: o front consulta a cada 5 s (conversa aberta) e 30 s (lista); "digitando…" e "online" só aparecem se o servidor mandar. Socket.IO é melhoria futura. Envio de foto exige `POST /uploads/presign` e armazenamento (Externo). |
| Notificações e preferências | Implementado | `/notifications…`, `/me/notification-prefs` (API). O envio por e-mail e WhatsApp é do back-end (Externo: contas). Push do navegador não faz parte do escopo. |
| Atividade (orçamentos, pedidos, avaliações, cupons, vistos) | Implementado | `/me/quotes`, `/quotes/{id}/accept|cancel`, `/me/wants`, `/me/reviews`, `/me/coupons`, `GET /recent` (novo). "Vistos" fica só no navegador. "Ver no mapa" nos pedidos depende do mapa (bloqueado). |
| Avaliar | Implementado | `GET /review-targets/{tipo}/{slug}`, `POST /reviews`, `POST /uploads/presign`. Rascunho fica só no navegador e não guarda as fotos. Duração do vídeo é conferida no navegador e **deve ser conferida de novo no servidor**. Moderação (pendente até 24 h) é do back-end. |
| Compartilhado (página pública com prévia) | Pendente | `GET /share/{type}/{id}`; exige renderização no servidor (prévia ao colar o link). Junto com o SEO do Fluxo 3. |
| Retomar ação depois do login | Implementado em parte | Retomam sozinhos: favoritar, seguir, conversar, pegar cupom, criar alerta (abre a janela). **Não retomam:** pedir orçamento, "útil" e avaliar (o formulário depende de dados que se perdem). |
| Avaliar a partir de Orçamento concluído | Front | O botão leva a `/avaliar?tipo=prestador`; o servidor precisa aceitar avaliação de prestador após orçamento concluído. |
| Atalhos de teclado, notificação do navegador | Front/Decisão | Não feitos. |

## Fluxo 5 · Conta, suporte e sistema

Código pronto (PR #8), **não validado com a API real** (testado no navegador contra um servidor de teste isolado). Contrato: `docs/contratos/conta.md`.

| Tela | Estado | Pendência |
|---|---|---|
| Minha Conta: Perfil (nome, e-mail, celular com código por SMS, CPF mascarado) | Implementado | `GET /me/profile`, `PATCH /me`, `POST /auth/otp/send {purpose:change_phone}` e `/auth/otp/verify` (API). O CPF nunca é editável. |
| Minha Conta: Endereços (principal único, não remove o último, CEP, "usar minha localização", raio padrão) | Implementado | `/me/addresses`, `/geo/cep`, `/geo/reverse`, `PUT /me/location`. Trocar o principal não atualiza o local do cabeçalho até o servidor refletir isso em `GET /me/location`. |
| Minha Conta: Interesses (CAT12, mínimo 3) | Implementado | `GET/PUT /me/interests`. |
| Minha Conta: Notificações (o que avisar, por onde, não perturbe à noite) | Implementado | `PATCH /me/notification-prefs` (**mudou em relação ao Fluxo 4**: antes `PUT` com outro formato; a janela da tela Notificações agora usa o mesmo formulário). Segurança e "Na EncontraÊ" travadas ligadas. A entrega real dos avisos (WhatsApp, e-mail, horário) é do back-end. |
| Minha Conta: Privacidade e segurança (trocar senha, aparelhos, privacidade, nome nas avaliações, histórico, baixar dados) | Implementado | `PUT /me/password`, `/me/sessions`, `POST /auth/logout`, `/me/search-history`, `POST /me/export`. Pedido de senha: o documento não descreve a tela de trocar senha; fiz modal com senha atual + nova (regras do cadastro). **Confirmar.** |
| Minha Conta: Excluir conta (3 passos, 30 dias) | Implementado | `POST/DELETE /me/deletion`. Prazo e textos são do documento; **revisão jurídica** (LGPD) pendente. O aviso "será excluída em…" aparece no topo de Minha Conta e permite cancelar. |
| Minha Conta: Configurações (tema, WhatsApp, idioma, mídia/sons) | Implementado | Autoplay e sons são só preferência gravada: ainda não há vídeo nem som no app para obedecê-las. "WhatsApp no aplicativo" usa `whatsapp://` (falha em computador sem o app); sem escolha, o app usa `wa.me`, que abre o app quando existe. **Decisão:** o documento diz "aplicativo" como padrão; mantive `wa.me` até a pessoa escolher, por ser mais seguro. |
| Sair da conta | Implementado | Sempre pergunta. Apaga local, histórico de buscas, comparação, vistos e rascunhos; mantém tema, cookies, modo do WhatsApp. |
| "Tem um negócio?" | Bloqueado | Área do lojista fora do escopo: o cartão diz "em breve". |
| Central de Ajuda (busca, categorias, "ajudou?") e Fale conosco | Implementado | `GET /help/faq` (todo o texto, inclusive horários, vem do servidor), `/help/faq/{id}/feedback`, `POST /help/contact` e `purpose:"help"` em `/uploads/presign`. Visitante pode usar. Cada resposta ajudou conta uma vez só **por clique no mesmo carregamento** (o servidor precisa impedir repetição). |
| Institucional (sobre, termos, privacidade, cookies, avaliações) | Implementado | `GET /legal/{doc}`: **nenhum texto jurídico está no código**. Sem a API ou sem revisão jurídica, a tela mostra erro/carregando. |
| Cookies: controles reais | Implementado | Mesma escolha do aviso da Home. Desempenho e Personalização andam juntos porque o app só tem uma chave de medição. |
| Denunciar (loja, produto, avaliação, prestador, story/live, outro) | Implementado | `GET /reports/target`, `POST /reports`. Denunciar **story/live e conversa** não tem ponto de entrada ainda (telas de Stories/Ao vivo pendentes). A denúncia de conversa continua usando o fluxo próprio do chat. |
| 404 | Implementado | Sugestões saem de `GET /discovery/home`; sem local ou sem dados somem. |
| Erro 500 | Implementado | "ref." é o código (digest) do Next; não há ainda como cruzar com o log do back-end. |
| Sem internet | Implementado | Faixa e nova tentativa a cada 10 s via `GET /status`; ao voltar, refaz as consultas. Não há tela dedicada "sem internet" para páginas que nunca carregaram (só a faixa). |
| Manutenção | Implementado | Tela cheia quando o servidor responde 503 com `MAINTENANCE`. "Me avise quando voltar" → `POST /status/notify`. |
| Regras de carregamento (esqueleto ≤ 300 ms, > 8 s vira "Algo deu errado") | Pendente | Cada tela tem seu estado de carregamento próprio; não há limite geral de 8 s. Fazer junto com a validação na API real. |
| "Oferta encerrada" (cupom/live) | Pendente | Depende da tela de oferta (`/o`) e de Ao vivo, que ainda não existem. |
| Estados vazios com próximo passo | Parcial | Feitos nas telas dos fluxos anteriores e nas novas; revisar todos com dados reais. |
| Área do lojista | Fora do escopo | Aparece "em breve" no rodapé. |

---

## Pendências externas (resumo)

1. Back-end publicar `/api/v1` na ordem das fases do "Pedido ao back-end" (inclui a seção 11, de entrada).
2. Escolher o serviço de mapas.
3. Contas: SMS, e-mail, armazenamento de fotos, hospedagem.
4. Revisão jurídica: termos, privacidade, prazos da LGPD.
5. Logo em vetor (SVG).
6. Confirmar que o repositório do back-end (`plataforma-`) é privado.
