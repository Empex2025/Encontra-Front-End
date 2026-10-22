# Roteiro — Explorar e cartões, conferindo com o protótipo

Branch: `fix/fid2-explorar`. Protótipo: `Explorar` (artboard), `HomeV2` (blocos de cartões). App: `/explorar` e `/`.
Compare em tela de 1440 px de largura (e depois em 390 px, celular). Sem back-end o app mostra os estados de erro/vazio; os cartões só aparecem com dados reais.

## 1. Descoberta (`/explorar`, sem digitar)
1. Título "Explorar" (32 px) e a frase "Encontre o que você procura…".
2. Busca com DOIS campos já aberta: "O que você procura" e "Onde" (com ×), "Cancelar" e botão âmbar "Buscar". À direita, o botão "Distância" (mesma altura da busca).
3. Linha de categorias: "Tudo" + 12 categorias (quadrados de 52 px, barra âmbar na escolhida).
4. NÃO há linha de lentes nem caixa "Filtrar" aqui (no protótipo elas só existem depois de buscar).
5. Título "O que tem perto de você" e, à direita, o seletor **Grade · Grade + mapa · Mapa**. Não há "Ordenar" na descoberta.
6. Grade em mosaico (5 colunas em 1440 px): foto com alturas diferentes, selo AO VIVO, "Patrocinado", título, preço, nota · km · bairro, loja e "Aberto agora". Serviços têm chip da categoria, "A partir de" e "(N avaliações)" ao lado da nota.
7. "Carregar mais resultados (N restantes)" no fim.

## 2. Busca (`/explorar?q=…`)
1. A busca vira a pílula "termo / local · Até N km" com "Nova busca" (clique reabre os dois campos; "Cancelar" fecha).
2. Aparecem "Descobrir por" (Tudo, Ao vivo, Ofertas… com contagem) e a caixa "Filtrar" (Tipo, Onde atende, Serviço, Avaliação — só os grupos que têm o que filtrar) com "Limpar filtros".
3. Título "N resultados para “termo”", botões "Quero “termo” em promoção" e "Ampliar para N km +ganho", "Ordenar" e o seletor de modo.
4. Modo padrão da busca: **Grade + mapa** (3 colunas + painel do mapa de 360 px). **Mapa**: lista de 440 px + mapa. O mapa é o espaço com aviso "Mapa ainda não conectado" (serviço de mapas não escolhido) e controles desabilitados. A escolha do modo fica gravada neste aparelho.
5. Sem resultado: "Ainda não tem “termo” até N km" com os caminhos Ampliar / Quero em promoção / **Perguntar às lojas perto** (visitante vê o convite; logado envia e mostra "Pergunta enviada").
6. Poucos resultados: seção "Parecidos com o que você buscou".

## 3. Distância
Botão "Distância" abre a janela "Até onde você quer ir?": valor grande, barra por degraus (1, 3, 5, 10, 20, 50 km — a escala do produto; o protótipo permite digitar qualquer km, aqui não), atalhos, "Cancelar" e "Mostrar resultados".

## 4. Blocos da Home (`/`)
Acontecendo (cartão vertical com selo AO VIVO/oferta e contagem de visualizações), Produtos, Serviços e Bares/restaurantes/eventos: o cartão de experiência abre com título e preço e o botão "mais ˅" mostra categoria, nota, bairro e quem oferece, igual ao protótipo. O cartão inteiro é clicável.

## 5. Celular (390 px)
Sem rolagem horizontal; categorias numa fileira rolável; busca em coluna; mapa antes da lista nos modos com mapa.
