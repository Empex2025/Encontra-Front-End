# Roteiro de teste: descobrir ao vivo (Stories, Ao vivo, Evento, Radar)

Abra o site no navegador. Para testar "sem back-end", rode o app sem servidor de dados (é o cenário padrão do desenvolvimento).

## 1. Home (`/`)

**Sem back-end e sem local definido**

- Veja o bloco **Stories** com título, descrição e a mensagem "Defina seu local para ver os stories..." e o link "Abrir os stories".
- Veja **Deixe a plataforma procurar por você** (visitante) com os botões "Criar conta e ativar meu radar" e "Já tenho conta". Um aviso "Não foi possível carregar seus avisos agora" com **Tentar de novo** aparece dentro da faixa azul (ela não some).
- Veja **Radar do bairro** com as três colunas (Preços no bairro, Mais procurados esta semana, Lugares chamando atenção), cada uma com a mensagem "Defina seu local...".

**Sem back-end, com local definido** (clique em "Definir local" no cabeçalho)

- Stories mostra "Não foi possível carregar os stories agora" e o botão **Tentar de novo** (erro não parece vazio).
- Cada coluna do Radar do bairro mostra o erro com **Tentar de novo**.

**Com dados**: Stories mostra os círculos das lojas; o Radar mostra os avisos com abas; as colunas do bairro mostram preços, buscas e lugares.

**Celular (largura 390)**: nada passa para o lado; as três colunas do bairro ficam empilhadas.

## 2. Stories (`/stories`, `/stories?perfil=...`)

- Sem back-end: tela preta com "Não foi possível carregar os stories", botão **Tentar de novo** e **Fechar**.
- Com dados e fila vazia: "Nenhum story por perto agora" (ou "Este perfil não tem stories ativos agora" quando a URL tem `perfil`).
- Com dados: setas do teclado, espaço pausa, Esc fecha; no fim da fila aparece "Você viu todos os stories de hoje" com "Ver de novo".
- Celular: toque na esquerda volta, na direita avança.

## 3. Ao vivo (`/ao-vivo/ID`)

- Sem back-end: esqueleto de carregamento e depois "Não foi possível carregar os resultados" com **Tentar de novo**.
- Com dados (live no ar): player com o aviso "serviço de streaming ainda não conectado" quando não há vídeo; contagem de quem assiste e tempo vêm do servidor; aba **Chat** (atualiza a cada 3 s) mostra "Nenhuma mensagem ainda" se vazio e, se falhar, um aviso com **Tentar de novo** sem apagar as mensagens; aba **Produtos**; interruptor **Lembrar das próximas lives** (pede conta se for visitante).
- O cartão **Outras lives agora** sempre aparece: carregando, erro com botão, ou "Nenhuma outra live...".
- Live encerrada: selo ENCERRADA, chat encerrado, botão de seguir.
- Celular: o vídeo ocupa a largura toda e o chat vem abaixo.

## 4. Evento (`/eventos/ID`)

- Sem back-end: esqueleto e erro com **Tentar de novo**.
- Com dados: todos os cartões sempre aparecem (Sobre, Programação, Ofertas, Quem vai, Para quem, Outros eventos perto); sem informação mostram uma frase explicando. Botões **Vou**, **Tenho interesse** (exclusivos), **Adicionar à agenda**, **Compartilhar**, **Denunciar**. Evento passado mostra "Este evento já terminou" e desabilita Vou/Interesse.
- Celular: coluna única, botões quebram de linha.

## Observação

O rodapé ainda mostra "em breve" ao lado de "Área do lojista" (fora deste fluxo).

## Conferência com o protótipo (fidelidade)

Veja a tabela completa em `docs/fidelidade/descobrir.md`. Itens para conferir lado a lado com os artboards Stories, AoVivo e Evento (1440 px e 390 px):

- **Stories (desktop)**: quadro 9:16 de 432×768 no centro; miniatura do perfil vizinho à direita (com a 1ª foto, nome e "há N h"); setas redondas (a anterior fica apagada no 1º story); coluna de ações ao lado do quadro: curtir (com contagem), enviar, salvar. Etiqueta de produto/serviço em cartão branco com o botão certo para cada tipo (produto: Quero comprar; serviço: Pedir orçamento + Ver perfil). Responder à loja mostra "Mensagem enviada ... Abrir conversa". Com a janela "Compartilhar" aberta, Esc fecha só a janela.
- **Stories (celular)**: ações sobre o story, à direita; toque nas laterais avança/volta.
- **Ao vivo**: título, loja, Seguir e curtir sobre o vídeo; Compartilhar e Denunciar no canto do vídeo; "Em destaque agora" com Quero comprar e Ver produto; "Como chegar" e "Lembrar das próximas lives"; painel Chat / Produtos com "Quero comprar" por produto; "Outras lives agora" em duas colunas, abaixo.
- **Evento**: capa com selo de data; barra Vou / Tenho interesse / Adicionar à agenda / Compartilhar; linha do tempo da programação; "Ofertas no evento" em caixa tracejada; lateral Quando / Onde / Entrada / Para quem; "Outros eventos perto" em duas colunas.
- Nenhuma barra de rolagem horizontal em 390 px.
