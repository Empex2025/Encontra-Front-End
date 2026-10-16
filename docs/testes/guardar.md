# Roteiro de teste — fluxo "guardar, acompanhar e conversar"

Telas: **Meus Favoritos**, **Minha atividade**, **Notificações**, **Conversas** e os **Alertas** (Avise-me e gestão).
Para o Kaio testar no navegador, sem precisar saber de código.

Como abrir o app: rode `npm run dev` na pasta do projeto e acesse `http://localhost:3000` (ou a porta que o terminal mostrar).
Sem o back-end ligado, o app funciona como "sem dados". Com o back-end ligado (variável `BACKEND_URL`), os dados reais aparecem.

> Regra geral desta auditoria: **nenhuma tela some**. Título, explicação, abas, filtros e busca ficam sempre na tela.
> O que muda é só o miolo: carregando (blocos cinza piscando), erro (mensagem + botão "Tentar de novo"), vazio (texto com orientação) ou os dados.
> Números nunca viram "0" por falta de informação: aparece "—".

---

## 1. SEM back-end (servidor desligado) — o que deve aparecer

Abra cada endereço e espere uns 8 segundos (o app tenta 3 vezes antes de desistir).

| Endereço | O que deve aparecer |
|---|---|
| `/favoritos` | Título "Meus Favoritos" e a frase de apoio. Quatro atalhos sem número ("Salvos que baixaram de preço", "Nenhuma comparação", "Alertas ativos", "Lojas com novidades"). Abas em pílula "Produtos e serviços", "Lojas e prestadores", "Listas", "Alertas", cada uma com "—" no contador. Barra branca com busca, "Mostrar: Todos / Baixaram de preço / Produtos / Serviços" e "Ordenar: Mais recentes / Menor preço / Mais perto" (os filtros não têm contagem). No miolo, a mensagem **"Não foi possível confirmar sua sessão"** com o botão **Tentar de novo**. |
| `/favoritos?aba=lojas` | Busca "Buscar entre quem você segue" e o aviso de sessão. |
| `/favoritos?aba=listas` | Busca, cartão tracejado "Nova lista" (o convite aparece no lugar da lista); abaixo, "Comparações salvas" com título, explicação e aviso. |
| `/favoritos?aba=alertas` | Faixa amarela explicando os alertas com o link "Ver avisos recebidos ›", busca, filtros "Todos / Ativos / Pausados" e o aviso. |
| `/atividade` | "Minha atividade", abas com "(—)" nos quatro primeiros e "Vistos recentemente (0)" (este só depende do seu navegador). Aba "Orçamentos": busca, filtros "Todos / Em andamento / Concluídos", busca e o aviso. "Quero em promoção" tem a faixa amarela com **+ Novo pedido** (desabilitado) e busca; "Minhas avaliações" e "Meus cupons" têm busca e o aviso. |
| `/atividade?aba=vistos` | Funciona mesmo sem conta: frase "Só você vê este histórico…", botão "Limpar histórico", busca e "Histórico vazio" com botão **Explorar**. |
| `/notificacoes` | "Notificações", a frase "— notificações não lidas" (ou "Seus avisos aparecem aqui depois que você entrar"), botões "Marcar todas como lidas" e "Preferências" (desabilitados), abas Todas / Alertas / Ofertas e cupons / Lojas que sigo / Minha atividade / Gerenciar alertas (—) e o aviso. |
| `/conversas` | Título, busca "Buscar loja ou produto" (desabilitada), filtros "Todas" e "Não lidas (—)", o aviso de sessão na lista e, ao lado, "Escolha uma conversa…". |
| `/conversas/qualquer-coisa` | Mesma estrutura; o aviso aparece no lugar da conversa. |

**Não deve aparecer:** página em branco, número "0" onde não há informação, as palavras "em breve", "em construção".

## 2. Como VISITANTE (servidor ligado, sem login)

Abra as mesmas telas. A estrutura é a mesma do item 1, mas no miolo aparece o convite **"Entre para ver seus favoritos / sua atividade / suas notificações / suas conversas"** com os botões **Criar conta grátis** e **Já tenho conta · Entrar**.
- Os campos de busca e os filtros aparecem, porém desabilitados.
- Clique em "Já tenho conta · Entrar": você vai para o login e, depois de entrar, volta para a mesma tela.
- `/atividade?aba=vistos` continua funcionando (é só do seu navegador).

## 3. COM dados (logado, back-end ligado)

**Favoritos** (`/favoritos`)
1. Os quatro atalhos mostram números reais e levam à aba ou ao Comparar; as abas mostram a contagem num selo.
2. Aba "Produtos e serviços": digite parte do nome na busca (acentos e maiúsculas não importam). Troque o filtro e a ordenação. "Nenhum favorito encontrado" aparece se a busca não achar nada.
3. Em um cartão: **+ Lista** (escolher lista ou criar uma nova), coração vermelho no canto da foto (remove e mostra o aviso).
4. Aba "Lojas e prestadores": busca, **Seguindo ✓** (deixa de seguir), **Conversar** (abre a conversa), **Ver loja / Ver perfil**.
5. Aba "Listas": cartão **Nova lista** (nome de 1 a 40 letras; vazio mostra erro), **Compartilhar** (copia o link), clicar na lista abre os itens, **Excluir lista**, **Comparar N desta lista**. Mais abaixo, "Comparações salvas" com **Abrir** e a lixeira.
6. Aba "Alertas": filtros Todos / Ativos / Pausados e busca, **Pausar/Ativar**, **Excluir**.

**Alertas "Avise-me"**: abra um produto (`/p/…`), clique em **Avise-me**, escolha as condições e **Criar alerta**. A janela final diz que o alerta pode ser pausado ou excluído em **Favoritos › Alertas**. Confira que ele aparece lá.

**Atividade** (`/atividade`)
1. Abas com a contagem real. Em "Orçamentos": filtros Em andamento / Concluídos, busca, **Aceitar orçamento**, **Cancelar pedido**, **Abrir conversa**.
2. "Quero em promoção": **+ Novo pedido**, busca, **Cancelar pedido**, **Pedir de novo** (se expirou). Quando há oferta: caixa verde "ENCONTRAMOS" com **Ver ofertas**.
3. "Minhas avaliações": **Editar** (nota e texto), **Excluir** (pede confirmação).
4. "Meus cupons": **Copiar código**, **Ver loja**.
5. "Vistos recentemente": abra alguns produtos antes; eles aparecem aqui. **Limpar histórico**.

**Notificações** (`/notificacoes`)
1. A frase do topo diz quantas não lidas (ou "Tudo em dia ✓" só quando o servidor confirmar que é zero).
2. Clique numa notificação (marca como lida), no X (remove), em "Ver mais" (carrega mais). **Marcar todas como lidas**. **Preferências** abre a janela com os interruptores.
3. Aba "Gerenciar alertas": mesma lista de alertas dos Favoritos.

**Conversas** (`/conversas`)
1. Lista com busca e filtro "Não lidas (N)". No computador, abre a primeira conversa sozinha.
2. Dentro da conversa: enviar texto, anexar foto (JPG/PNG/WebP), respostas rápidas, **Ver mensagens anteriores**.
3. Menu ⋮: **Silenciar**, **Bloquear** (com confirmação), **Denunciar** (escolher motivo), **Apagar conversa** (com confirmação).

## 4. Quando o servidor dá erro

Com o back-end ligado mas respondendo erro: cada bloco mostra **"Não foi possível carregar …"** com o botão **Tentar de novo**; o resto da página (título, abas, busca) continua. Um erro nunca deve parecer "lista vazia".

## 5. No celular (largura de 390 px; use o modo celular do navegador)

- Nada de rolagem para o lado na página (só as abas e os filtros rolam).
- `/conversas`: aparece só a lista; ao tocar numa conversa, só a conversa, com a seta ← para voltar.
- Os botões ficam com pelo menos 40 px de altura e as abas podem ser arrastadas para o lado.
- Barra de baixo (Início, Explorar, Ofertas, Favoritos, Conversas) continua visível.
- O aviso de cookies pode cobrir parte da tela: clique em "Só os necessários" para tirá-lo antes de conferir.
