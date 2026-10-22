# Roteiro de teste — Início (Home) e estrutura global

Fluxo: `home-shell`. Telas: Início (`/`), cabeçalho, menu lateral, barra inferior do celular, rodapé e aviso de cookies.
Branch: `fix/fidelidade-home`. Como abrir: `npm run dev` e acesse `http://localhost:3000`. Compare com o artboard **HomeV2** do protótipo, em janela de **1440 px**.

Regra que vale em tudo: nenhuma seção some; sem dado, a seção fica com título e uma frase. Erro mostra "Tentar de novo". Nunca aparece "Em breve".

## A. Ordem da página (1440 px)

De cima para baixo, deve ser exatamente: cartão branco com **busca → Atalhos → categorias → Mapa de Resultados**; **Stories**; **Promoções e ofertas agora**; **Produtos relevantes perto de você**; **Serviços relevantes perto de você**; **Bares, restaurantes, eventos**; **Meu Radar** (painel azul); **Radar do bairro**; rodapé azul.

- Largura do conteúdo: 1280 px, com 80 px de margem em cada lado. O menu lateral flutua por cima, sem empurrar o conteúdo.

## B. Barra de busca (dois campos)

1. Dois campos lado a lado: "O que você procura? Produto, serviço ou lugar…" e "Bairro ou cidade", mais o botão âmbar **Buscar**.
2. Clique no primeiro campo: abre o painel com **Buscas recentes** (com "Limpar" e × em cada uma) e **Buscas populares perto de você**. Digite: o painel muda para **Sugestões** e mostra "Buscar “termo” em {local}". Setas ↑ ↓ e Enter funcionam; Esc fecha.
3. Clique no segundo campo: aparece "Usar minha localização atual" e, ao digitar 2+ letras, bairros e cidades sugeridos. Escolha um e clique **Buscar**: o local passa a valer para a Home e para o Explorar (confira no cabeçalho).
4. **Buscar** com o primeiro campo vazio leva ao Explorar, igual ao Enter. Os 6 **Atalhos** (Onde almoçar, Postos perto, Eletricista, Farmácia 24h, Pet shop, Barbearia) buscam na hora.

## C. Categorias e Mapa

1. A faixa começa com **Novidades** (círculo destacado em âmbar), um divisor e as 12 categorias, na ordem fixa. Cada uma abre o Explorar já filtrado; Novidades abre o que é novo perto de você.
2. **Mapa de Resultados** vem logo depois das categorias, com o link **Abrir mapa completo ›** (leva ao Explorar) e os controles de expandir/aproximar/afastar desabilitados com explicação.
3. O chip **"Todos · N locais perto de você"** só aparece quando o servidor informa o total (`mapTotal`). Sem back-end, o chip não aparece (nunca um número inventado).
4. O mapa em si continua bloqueado até o serviço de mapas ser escolhido.

## D. Blocos de descoberta (Acontecendo, Produtos, Serviços, Experiências)

1. Cada bloco tem: rótulo em caixa-alta com ícone, título, subtítulo, contador ("1–6 de 12"), **setas** para avançar/voltar, **abas** em pílulas e **Ver todos** (leva ao Explorar já filtrado).
2. Abas: Acontecendo (Tudo · Ao vivo · Vídeos · Promoções e ofertas · Menor preço); Produtos (Tudo · Esporte · Moda · Eletrônicos · Casa e construção); Serviços (Tudo · Disponível hoje · Casa e reparos · Beleza · Limpeza · Automotivo); Experiências (Tudo · Aberto agora · Comer · Beber · Passeios · Para crianças · Eventos). Setas ← → do teclado trocam a aba.
3. Trocar de aba ou página busca no servidor; carregando mostra esqueleto, erro mostra "Tentar de novo" dentro do bloco, aba sem itens diz "Nenhum item nesta aba perto de você agora".
4. Cartões: **Acontecendo** = cartão vertical de 380 px com foto, etiqueta (AO VIVO, % OFF, Oferta, Novo), "N assistindo" e botão de play nas lives; **Produtos** = foto alta, coração, motivo ("Mais perto", "Você segue"…), nota e quantidade de avaliações, preço com desconto, loja e "Aberta agora"; **Serviços** = especialidades, "A partir de", nota e quantidade de avaliações, "Atende em domicílio/no local"; **Experiências** = foto cheia de 420 px com etiqueta "Aberto agora / Hoje, 20h". Só aparece o que o servidor trouxe.
5. Coração: visitante vê o convite para entrar; depois do login o item é salvo.

## E. Stories, Meu Radar e Radar do bairro

- **Stories**: cartão branco, "Ver todos", atalho "Perto agora", círculos das lojas (anel âmbar = você segue, vermelho + AO VIVO = ao vivo, número = quantidade de stories).
- **Meu Radar** (painel azul): visitante vê o convite (Criar conta / Já tenho conta); com conta, "Seu radar encontrou N novidades", abas com contagem, **Marcar tudo como visto** (a bolinha some e a manchete vira "Você está em dia"), **Ajustar o que meu radar procura**.
- **Radar do bairro**: faixa verde/vermelha de destaque (só se o servidor mandar), e três colunas: Preços no bairro (com minigráfico e variação), Mais procurados (1 a 5, com crescimento) e Lugares chamando atenção.

## F. Estrutura global

1. **Cabeçalho** (84 px): logo, "local · raio" (clique abre o painel de local e distância) e "Minha Conta" (visitante vê "Entrar").
2. **Menu lateral**: recolhido, só ícones (72 px). Passe o mouse ou use Tab: ele abre por cima do conteúdo (280 px) com os nomes e contadores; sem passar o mouse, os contadores viram bolinha vermelha. "Meus Favoritos" mostra o submenu quando está ativo. **Fixar menu aberto** mantém aberto e empurra o conteúdo (e vira "Recolher menu"). Modo escuro funciona.
3. **Celular (390 px)**: menu lateral some; aparece a barra inferior (Início, Explorar, Ofertas, Favoritos, Conversas, Mais). Sem rolagem horizontal. A busca empilha os dois campos e o botão.
4. **Rodapé** azul: colunas "Como Funciona" e "Suporte". Não há "em breve" nem redes sociais/Área do Lojista sem endereço configurado (`NEXT_PUBLIC_MERCHANT_URL`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL`).
5. **Aviso de cookies**: cartão no canto superior direito. "Aceitar todos" libera a medição de uso; "Só os necessários" ou fechar sem escolha não envia eventos. O link leva à política.

## G. Sem back-end (cenário atual)

Sem API, todos os blocos mostram erro com "Tentar de novo" ou "Defina seu local…" (sem local); o chip do mapa não aparece; Meu Radar mostra "Não foi possível carregar seus avisos agora".

## H. Com back-end

Confirmar contra a API real: paginação e abas (`GET /discovery/home?section&tab&page&limit`), `mapTotal`, campos opcionais dos cartões (`viewCount`, `specialties`, `serviceNote`, `scheduleLabel`, `favorited`, `profile.avatarUrl`), story `live`, faixa de destaque e minigráfico dos preços. Contratos em `docs/contratos/home.md` e `docs/contratos/radar.md`.
