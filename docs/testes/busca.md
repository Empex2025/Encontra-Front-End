# Roteiro de teste — Busca e descoberta

Fluxo: Início, Explorar, Ofertas, Comparar, cabeçalho, menu lateral, barra inferior do celular e rodapé.
Branch: `fix/auditoria-busca`. Como abrir: rode o app (`npm run dev`) e acesse `http://localhost:3000`.

Regra geral que vale em todas as telas: **nenhuma seção some**. Sem dados, a seção continua com título e uma frase explicando o que falta. Erro mostra "Tentar de novo". Nunca aparece "Em breve".

## A. SEM back-end (cenário atual: a API ainda não responde)

1. **Início (`/`)**, sem local definido
   - Veja, de cima para baixo: busca em destaque, "Atalhos", "Buscas recentes" (diz "Nenhuma busca ainda neste aparelho"), "Buscas populares perto de você" (diz que não foi possível carregar, com "Tentar de novo").
   - Seções: **Stories**, categorias (12), **Meu Radar** (convite para criar conta, abas Tudo/Novidades/Preços), cartão "Onde você quer procurar?", **Acontecendo perto de você**, **Produtos**, **Serviços**, **Experiências** (todas pedem para definir o local), **Mapa** e **Radar do bairro** (três colunas).
   - No **Mapa**: aviso "Mapa ainda não conectado", botões de zoom desabilitados, legenda (Loja, Prestador, Oferta, Ao vivo) e "Resultados com coordenadas: —".
2. **Início com local**: toque no local do topo, digite "Boa Viagem, Recife", **Aplicar**.
   - Agora Stories, descoberta e Radar do bairro mostram **erro com "Tentar de novo"** (e não "vazio"). Cada coluna do Radar do bairro tem o seu próprio botão.
   - Meu Radar mostra "Não foi possível carregar os avisos agora" com botão, mantendo as abas.
3. **Explorar (`/explorar`)**
   - Aparecem: busca, distância, 12 categorias, faixa "Tudo / Ao vivo / Ofertas…" (desabilitadas sem dados), caixa **Filtrar** (Tipo, Onde atende, Serviço, Avaliação, tudo desabilitado), **Ordenar** (desabilitado sem termo), botões **Grade** e **Mapa**.
   - Sem local: cartão "Onde você quer procurar?". Com local e sem API: "Não foi possível carregar" + "Tentar de novo" + nota "a fonte de dados pode ainda não estar conectada".
   - Clique em **Mapa**: área do mapa com aviso neutro, legenda, e a lista de resultados ao lado (no celular, embaixo). Clique em **Grade** para voltar.
4. **Explorar com busca (`/explorar?q=tenis`)**
   - O título muda para "Não foi possível buscar “tenis”" (nunca "0 resultados" quando é erro).
   - Botão "Quero “tenis” em promoção" abre o pedido (pede conta se for visitante).
5. **Ofertas (`/ofertas`)**
   - Título, **Cupons do dia** (com frase de estado), **Todas as ofertas**, busca, **Ordenar**, **Aberto agora**, botão **Todas** das categorias: tudo visível mesmo sem local.
   - Sem local: cartão para definir local dentro da lista. Com local e sem API: erro com "Tentar de novo".
6. **Comparar (`/comparar`)** com 0 itens
   - "Sua comparação (0 de 3)", campo de busca, "Nenhuma opção escolhida ainda", três vagas ("Opção 1/2/3 – Vaga livre") e botão "Voltar à pesquisa".
   - Digite 1 letra: aparece "Digite pelo menos 2 letras…". Com 2+ letras e local, aparece "Buscando…" e depois o erro com "Tentar de novo".
7. **Cabeçalho**: clique na busca (telas que não são Início/Explorar, ex.: `/ofertas`). O painel nunca fica mudo: mostra "Carregando sugestões…", o erro, ou "Nenhuma sugestão. Pressione Enter…". Faça uma busca e volte: ela aparece em "Buscas recentes", com X para remover.
8. **Rodapé**: "Área do lojista · indisponível nesta versão" (sem "em breve").

## B. COM back-end (quando as rotas existirem)

- Início: blocos com cartões, "Ver todos (N)"; bloco sem itens mostra "Ainda não há itens aqui…" (os demais continuam). Stories no topo; Radar do bairro com preços (com base de cálculo), mais procurados e lugares.
- Explorar: título "N resultados para “termo”", contagens nas lentes e filtros, filtros sem resultado ficam desabilitados, "Ampliar para N km", "Carregar mais".
- Explorar › Mapa: "Resultados com coordenadas: X de Y" usa só coordenadas reais que a API devolver. O mapa em si continua desabilitado até o serviço de mapas ser escolhido.
- Ofertas: cupons, filtros por categoria com contagem, mensagem diferente para "sem ofertas" e "sem ofertas com esses filtros".
- Comparar: toque em "Comparar" num cartão (produto ou serviço). Com 2 ou 3 itens da mesma categoria o quadro lado a lado aparece. Cartão sem grupo comparável mostra o botão desabilitado com explicação (passe o mouse).

## C. No celular (largura 390 px)

1. A barra inferior tem 6 itens: Início, Explorar, Ofertas, Favoritos, Conversas e **Mais**.
2. Toque em **Mais**: abrem Comparações, Notificações, Minha Conta e Configurações. Esc ou toque fora fecha.
3. Nenhuma tela tem rolagem horizontal (exceto as faixas de categorias e atalhos, que rolam de propósito).
4. Explorar › Mapa: o mapa vem em cima e "Resultados" embaixo.
5. O aviso de cookies cobre a barra inferior até você escolher uma opção; é o comportamento esperado.
