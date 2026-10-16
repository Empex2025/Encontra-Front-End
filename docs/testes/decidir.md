# Roteiro de teste — fluxo Decidir / Confiar

Para testar no navegador (computador e celular). Rode o app com `npm run dev` (ou use o endereço que o time passar). Troque `ALGUM-ENDERECO` por um endereço real quando houver back-end.

Regra geral: **nenhuma tela some ou fica em branco**. Se faltar dado, aparece o rótulo com "Não informado" ou "—". Se o servidor falhar, aparece uma mensagem de erro com o botão **Tentar de novo** (erro nunca se disfarça de "vazio"). "Não encontrado" (404) é uma tela própria.

## A. SEM back-end (servidor desligado)

| URL                          | O que deve aparecer                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/p/qualquer`                | Título "Não foi possível carregar o produto", explicação do erro, botões **Tentar de novo** e **Buscar outros produtos**.                    |
| `/l/qualquer`                | "Não foi possível carregar a loja" + **Tentar de novo**.                                                                                     |
| `/s/qualquer`                | "Não foi possível carregar o prestador" + **Tentar de novo**.                                                                                |
| `/o/qualquer`                | "Não foi possível carregar a oferta" + **Tentar de novo** e link para ofertas.                                                               |
| `/listas/qualquer`           | "Não foi possível carregar a lista" + **Tentar de novo**.                                                                                    |
| `/avaliar?tipo=produto&id=x` | Visitante: "Entre para avaliar".                                                                                                             |
| `/avaliar` (sem nada)        | "Não encontramos o que você quer avaliar" explicando que o endereço está incompleto.                                                         |
| `/denunciar`                 | Formulário completo (tipo, nome, motivo, descrição).                                                                                         |
| `/denunciar?tipo=loja&id=x`  | Formulário completo + aviso "Não foi possível buscar o nome do item automaticamente" com **tentar de novo**; o campo Nome continua editável. |

Checar: nenhuma página em branco; nenhum texto "em breve".

## B. COM dados, mas incompletos (o caso mais comum no começo)

**Produto `/p/ALGUM-ENDERECO`**

- Preço sem data: aparece "Preço informado pela loja. Data da atualização não informada."
- Sem foto: quadro "Sem foto". Sem avaliações: "Ainda sem avaliações · Vendas não informadas".
- Disponibilidade: sempre escrita como "segundo a loja" e, sem data, "Confirme com a loja antes de ir". Desconhecida: "Disponibilidade não informada".
- Sem WhatsApp: botão cinza **WhatsApp não informado** com explicação (não clica).
- Sem grupo de comparação: botão **Comparar** cinza com explicação e link "buscar opções parecidas".
- Painel **Sinais de confiança**: Verificação, Preço, Disponibilidade, Tempo de resposta (cada um com valor ou "Não informado"). **Selos da loja** e **Informações técnicas** sempre presentes.
- **Como chegar**: link se houver endereço/coordenadas; senão aviso "indisponível: endereço não informado".
- Bloco **Quem viu este produto também viu**: lista; vazio → "Ainda não há produtos relacionados"; erro → mensagem + **Tentar de novo**.
- Abas Descrição, Avaliações, Sobre a loja sempre visíveis.

**Loja `/l/ALGUM-ENDERECO`**

- Números do topo: sem dado aparece "—" (nunca 0 no lugar de "sem dado").
- **Sinais de confiança** (verificação, CNPJ, perfil atualizado, tempo de resposta, na EncontraÊ desde, horário) e **Destaques** sempre presentes.
- Abas Fotos e vídeos, Loja, Ofertas, Avaliações, Sobre: cada uma mostra carregando (esqueleto), erro (**Tentar de novo**) ou vazio com orientação.
- Em Sobre: **Como chegar** cinza com explicação se não houver localização.
- No fim: **Outras lojas perto de você** (lista, vazio ou erro).

**Prestador `/s/ALGUM-ENDERECO`**

- Indicadores Recomendam / Serviços feitos / Experiência / Próximo horário (com "—").
- Seções Serviços, Fotos de trabalhos, Avaliações, Sobre, Pedir orçamento sempre presentes.
- Sem serviços: o formulário de orçamento fica desativado com aviso; use **Conversar**.

**Oferta `/o/ALGUM-ENDERECO`**

- Página pública própria (sem menu lateral): cabeçalho com **Entrar** e **Criar conta grátis**, cartão com foto, loja, preço, contagem regressiva, **Pegar cupom**, **WhatsApp**, **Como chegar** e **Conversar**; coluna lateral "Como este link aparece no WhatsApp" e convite para criar conta (só para visitante).
- Sem prazo: "Prazo da oferta não informado". **Sinais de confiança**, **Mais desta loja**, **Parecidos perto** (somem se vazios). Oferta encerrada mostra o aviso "Oferta encerrada".

**Lista pública `/listas/ALGUM-TOKEN`**

- Mesma página pública (sem menu lateral). Faixa "Fulano te enviou isto pelo EncontraÊ" só se a lista trouxer o primeiro nome do dono. Filtros Tudo / Produtos / Serviços / Lugares com contagem (cinza se zero). Lista vazia: "Esta lista ainda não tem itens".

**Avaliações (abas Avaliações do produto/loja/prestador)**

- Sem avaliações: nota "—", barras "—", mensagem "Ainda não há avaliações". Com avaliações: botões **Útil** (pede conta se for visitante) e **Denunciar** em cada uma. Avaliação sem texto mostra "Esta pessoa deu a nota sem escrever comentário".

**Avaliar `/avaliar?tipo=produto&id=ALGUM-ENDERECO`** (logado): esqueleto enquanto carrega; 404 → "Não encontramos…"; erro → **Tentar de novo**; quatro cartões numerados (nota com estrelas de 40 px, fotos e vídeo em quadrados tracejados de 120 px, comentário, "Destaques e atendimento" que abre e fecha), chave "Mostrar meu nome", barra inferior com "Nota ✓ / Fotos 0/2", **Salvar rascunho** e **Publicar avaliação**. Voltar com algo preenchido pergunta **Descartar / Continuar editando / Salvar e sair**. Depois de publicar: resumo e dois botões.

**Denunciar `/denunciar`**: com `?tipo=…&id=…` o tipo e o nome vêm preenchidos. Tipo em chips, motivo em 6 opções (2 colunas), descrição (mínimo 10), **Anexar print** (escolhe uma imagem JPG/PNG de até 5 MB; precisa de `POST /uploads/presign`), "A loja não fica sabendo quem denunciou". Depois de enviar: protocolo, resumo e **Fazer outra denúncia**.

## C. No celular (largura ~390 px)

- Nenhuma barra de rolagem horizontal.
- Botões de contato empilham; painel de sinais de confiança vira uma coluna.
- Abas rolam para o lado; barra inferior não cobre os botões principais.
- Modo escuro: textos legíveis nos painéis e botões cinza.
