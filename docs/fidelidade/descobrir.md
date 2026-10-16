# Fidelidade ao protótipo — fluxo "descobrir ao vivo"

Boards: `Stories`, `AoVivo`, `Evento` (1440 px; conferido também em 390 px). Home (`HomeV2`) só comparada, sem edição. Estados: feito · depende de dado real · depende de back-end · decisão de produto.

## Stories (`/stories`)

| Elemento do protótipo | No código antes | Ação | Estado |
|---|---|---|---|
| Fundo `#050B24` com o story desfocado (opacidade .25) | `bg-black` + imagem desfocada a 40% | Token `stage` + wrapper que não cria rolagem | feito |
| Cabeçalho 72 px: marca, subtítulo com filete, botão "Fechar" em pílula | Só texto à esquerda e botão retangular | `Shell` com `Logo`, subtítulo e pílula (também nos estados carregando/erro/vazio/fim) | feito |
| Quadro 432×768, raio 18, sombra, proporção 9:16 | Coluna 420 px com `max-h` | Mesma medida; encolhe mantendo 9:16 em telas baixas | feito |
| Miniaturas dos perfis vizinhos 200×356 (foto, avatar com anel, nome, "há N h") | Só avatar e nome, 96 px | `NeighborCard` com o 1º story do perfil (dado real) | feito |
| Setas redondas 48 px (anterior apagada no 1º story) | Não havia | Botões nas duas pontas | feito |
| Coluna de ações: curtir (com contagem), enviar | Pílulas embaixo do quadro | Coluna de círculos 52 px ao lado do quadro; no celular fica sobre o story, à direita | feito |
| Etiqueta de produto/serviço: cartão branco, miniatura 52, tipo colorido, título, preço, CTA 160 px | Cartão escuro translúcido | Cartão `bg-surface`; cores por papel (novo token `kind-service`); serviço mostra "A partir de" | feito (ver decisões) |
| Barras de progresso 3 px, avatar 40 com anel âmbar, nome + selo, "Seguir/Seguindo", pausa | Parecido, tamanhos diferentes | Medidas do protótipo | feito |
| Título 26/32 800 + linha de apoio 14/20 | Só `caption` pequeno | `caption` vira o título; `subtitle` opcional | feito / depende de back-end (`subtitle`) |
| Campo "Responder a …", botão enviar âmbar quando há texto | Botão branco | Âmbar com texto, branco 60% sem texto | feito |
| "Mensagem enviada para X ✓ · Abrir conversa" (pílula verde) | Texto solto | Pílula verde | feito |
| Aviso (toast) no alto, centralizado | Aviso global embaixo, cobria o campo de resposta | Aviso local no alto | feito |
| Fim da fila: ícone, texto longo, "Ver de novo" + "Ver o que está perto de mim" | Sem ícone, botões brancos | Igual ao protótipo | feito |
| Salvar | Botão ao lado de curtir | Mantido como terceiro item da coluna (o protótipo tem a lógica, mas não desenha o botão) | decisão de produto |
| "N views" | Texto no rodapé | Removido do visualizador (não existe no protótipo) | decisão de produto |
| Esc com janela aberta | Esc fechava os Stories mesmo com a janela "Compartilhar" aberta | Teclas ignoradas com `<dialog>` aberto (defeito corrigido) | feito |
| Vídeo acompanha a pausa | Não pausava | `pause()/play()` junto do cronômetro | feito |

## Ao vivo (`/ao-vivo/[id]`)

| Elemento | No código antes | Ação | Estado |
|---|---|---|---|
| Grade 1fr + 380 px, largura máx. 1280 | `max-w-6xl`, 360 px | Medidas do protótipo | feito |
| Vídeo 16:9 com título, loja, "Seguir" e curtir **sobre** o vídeo; selos AO VIVO (ponto pulsando), assistindo (olho), tempo (relógio) | Selos redondos; título e ações abaixo do vídeo | Tudo sobreposto como no protótipo; no celular o vídeo é 4:3 e Compartilhar/Denunciar vão para abaixo | feito |
| "Compartilhar" e "Denunciar" em pílulas escuras no canto do vídeo | Botões abaixo | Pílulas sobre o vídeo (`ShareButton` ganhou `className`) | feito |
| Corações subindo | Existia | Mantido, na posição do protótipo | feito |
| Live encerrada: ícone, "A live terminou: …", "Ver ofertas da loja", seguir | Cartão abaixo do vídeo | Sobre o vídeo | feito |
| "Em destaque agora": imagem 128, rótulo com alfinete, preço 20/800, selo verde, "Quero comprar" + "Ver produto" | Borda âmbar, imagem 80 | Cartão do protótipo; sem produto, mostra estado vazio (antes sumia) | feito |
| "Mais opções" em 280 px: linha "Como chegar" (com local) e chave "Lembrar das próximas lives" | Caixa única com título | Duas linhas com ícone quadrado; sem endereço: "Local não informado pela loja" | feito |
| Painel 620 px: abas Chat / Produtos (n) em pílula azul; mensagens com avatar de iniciais, selo "Loja", fundo âmbar para a loja; campo + botão âmbar | Abas com sublinhado, mensagens em bloco | Igual ao protótipo | feito |
| Aba Produtos: cartões com imagem 72, preço, "Quero comprar" e "Ver produto" por produto | Lista de links | "Quero comprar" abre conversa com **aquele** produto | feito |
| "Outras lives agora" em largura total, 2 colunas, capa 176×104 com selos AO VIVO e "N assistindo", loja · local, título, "Assistir" | Cartão dentro da coluna lateral, miniaturas 56 px | Seção abaixo, igual ao protótipo | feito |
| "Protótipo: simular fim da live" | — | Não copiado (só existe no protótipo) | n/a |
| Aviso "streaming ainda não conectado" | Faixa no rodapé do vídeo | Mantido, centralizado no vídeo | depende de back-end |

## Evento (`/eventos/[id]`)

| Elemento | No código antes | Ação | Estado |
|---|---|---|---|
| Capa 320 px, raio 20, degradê, selo de data branco 88 px (mês, dia 38, dia da semana), selos Hoje/Gratuito, título 40 px, "Organizado por … ›" com avatar | Capa sem cor de fundo (classe `navy-900` não existia), selo 64 px, título 30 px | Token `navy-900`; medidas do protótipo | feito |
| Barra de ações: "Vou" âmbar com ✓, "Tenho interesse" com estrela, agenda, compartilhar, "86 vão · 140 interessados", Denunciar discreto | "Vou" azul; Denunciar vermelho | Igual; estados marcados (verde / azul) | feito |
| Sobre, Programação com linha do tempo (hora, bolinha âmbar, filete) | Lista com divisores | Linha do tempo | feito |
| Ofertas no evento: caixa tracejada âmbar com ícone, título, texto, "Pegar cupom" / código + "Ver meus cupons ›" | Título e botão soltos | Caixa do protótipo; texto montado com dados do cupom (% e validade) | feito |
| Quem vai: avatares sobrepostos de 40 px + "N pessoas vão, M que você segue" + frase de apoio | Círculos azuis | Iniciais e cores por token | feito |
| Perguntas ao organizador: linha com ícone, texto e "Perguntar" | Bloco simples | Igual | feito |
| Lateral fixa (sticky): Quando (com selo "Começa em 4 h" / "Acontecendo agora"), Onde (endereço, quadro do mapa, "Como chegar"), Entrada (Gratuita / Inscrição R$), Para quem (chips) | Blocos simples sem ícones | Cartões com ícone quadrado; textos de data calculados (`eventWhenText`, `eventChip`, com testes) | feito |
| Quadro do mapa em "Onde" | Não havia | Ilustração fixa (ruas) com rótulo "bairro · distância" real | decisão de produto |
| "Outros eventos perto" em largura total, 2 colunas, capa 160×112 com data, título, quando, organizador · bairro, "Gratuito · N vão" | Lista pequena na lateral | Seção do protótipo; organizador e "N vão" só quando a API enviar | feito / depende de back-end |

## Home (somente comparação — arquivos em `src/components/home/` são do agente da Home)

| Elemento do protótipo | No código | Diferença |
|---|---|---|
| Faixa de Stories: cartão branco com título "Stories" e "Ver todos" (âmbar) à direita; itens 112 px quadrados arredondados (raio ~32) com anel (âmbar = novo, azul = visto, vermelho = ao vivo), selo "AO VIVO" e contador de stories, nome + "há 2 h"/distância; primeiro item "Perto de você · no mapa" | `home-stories.tsx`: círculos 64 px sem cartão, sem "Ver todos", sem contador, sem selo ao vivo, sem item "no mapa", subtítulo extra | Falta cartão, "Ver todos" (link para `/stories`), formato quadrado arredondado, tamanho 112, rótulos de tempo/distância, anel azul para visto (hoje cinza), selo "AO VIVO" e contador (dependem de campos `live`/`count` na API de preview) |
| "Promoções e ofertas agora": sobretítulo "ACONTECENDO PERTO DE VOCÊ", H2 grande, descrição, paginação "1-6 de 12" com setas, abas Tudo / Ao vivo / Vídeos / Promoções e ofertas / Menor preço, cartões em formato reel 200×380 (selo AO VIVO + assistindo, botão play, loja + km, título, preço em âmbar) | `home-sections.tsx`: título "Acontecendo perto de você" simples, sem abas, sem setas, sem contador | Faltam abas e filtro, setas e "1-6 de N", o formato reel dos cartões e o sobretítulo com ícone; título do protótipo é "Promoções e ofertas agora" |
| Meu Radar: painel azul com texto à esquerda, botões "Marcar tudo como visto" e "Ajustar o que meu radar procura", linha "Acompanha: N lojas…", lista de avisos em 2 colunas com ícone colorido, hora e ponto âmbar | `home-radar.tsx` tem a base (faixa azul, abas, botão Ajustar) | Conferir a grade em duas colunas, o resumo "Acompanha…" e "Marcar tudo como visto" fixo à esquerda |
| Radar do bairro: sobretítulo "RADAR DO BAIRRO", H2 "O que está mudando perto de você", faixa verde com destaque ("A gasolina caiu…") e "Ver no mapa ›", três cartões (Preços no bairro com mini-gráfico e variação, Mais procurados com ranking e %, Lugares chamando atenção com avatar) | `neighborhood-radar.tsx`: título "Radar do bairro", três colunas simples | Falta o H2 do protótipo, a faixa de destaque, mini-gráficos (precisam de série de preços na API), ranking numerado com variação |
| Ordem geral | Busca, Stories, categorias, Radar, descoberta, Produtos, Serviços, Experiências, Mapa, Radar do bairro | No protótipo o Mapa vem logo após as categorias e os Stories ficam depois do mapa/antes das promoções; ordem a alinhar com o agente da Home |

## Decisões para o Kaio

1. **Salvar story**: o protótipo tem a lógica, mas não desenha o botão. Mantive um terceiro item na coluna lateral. Remover?
2. **"N views"** nos Stories não existe no protótipo; saiu do visualizador.
3. **"A partir de R$"** no cartão de serviço vem do protótipo; assumi que `priceCents` de serviço é preço inicial. Confirmar com o back-end.
4. **Quadro do mapa no Evento** é ilustração fixa (pino sempre no centro). O mapa real depende do serviço de mapas; hoje só o rótulo (bairro · distância) e o link "Como chegar" são reais. Manter a ilustração ou trocar por um aviso?
5. **Menu lateral**: no protótipo é um trilho recolhido de 72 px (abre ao passar o mouse) e o conteúdo tem 80 px de margem (1280 px úteis). No app o menu fica aberto (256 px), então as telas ficam com ~1100 px. Decisão do dono do layout.

## Pendências de back-end (novas)

- `stories[].subtitle` (linha de apoio abaixo do título), opcional.
- `GET /happenings` (lista "Outros eventos"): `organizerName`, `priceCents`, `going`, opcionais.
- Preview de stories da Home: campos de "ao vivo" por perfil e quantidade de stories (selo e contador).
- Série de preços para o mini-gráfico do Radar do bairro; destaque do bairro ("a gasolina caiu…").
