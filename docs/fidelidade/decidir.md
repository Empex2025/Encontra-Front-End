# Fidelidade ao protótipo — fluxo Decidir

Comparação feita em 15/10/2026, lado a lado: artboard (1440 px, `.dc.html`) × rota do app (1440 e 390 px), com um servidor de teste descartável (fora do repositório) devolvendo dados de exemplo para ver o layout preenchido. Os dados do protótipo **não** foram copiados: só estrutura, ordem, tamanhos, textos fixos e controles.

| Artboard                         | Rota                            | Estado                                    |
| -------------------------------- | ------------------------------- | ----------------------------------------- |
| Produto                          | `/p/[slug]`                     | Igualado (commit 577a2ca)                 |
| LojaPerfil                       | `/l/[slug]`                     | Igualado (commit 835afe6)                 |
| PrestadorPerfil                  | `/s/[slug]`                     | Igualado (commit 835afe6)                 |
| Compartilhado                    | `/o/[slug]` e `/listas/[token]` | Igualado (nova página pública)            |
| Avaliar                          | `/avaliar`                      | Igualado                                  |
| (aba Denunciar do Institucional) | `/denunciar`                    | Igualado                                  |
| CardB / CardServico / CardSizes  | `ResultCard` (Home/shell)       | Não editado: dono é o agente "home-shell" |

## Diferenças encontradas e o que foi feito

**Produto, Loja, Prestador** (feitos no primeiro passo deste fluxo): galeria com setas, contador e miniaturas; coluna de ações (preço, tamanho, quantidade, Conversar/WhatsApp, perguntas prontas, Como chegar / Ver loja / Comparar, cupom, mesma linha, mensagem pronta, selos da loja); abas sublinhadas; "Quem viu também viu"; capa, avatar com anel ao vivo, destaques e grade 3 × N com abas no perfil da loja; cartão do prestador, serviços e preços com seleção, fotos, avaliações, área e horários, painel "Pedir orçamento". Neste passo: contagem de publicações na aba "Fotos e vídeos" da loja.

**Compartilhado** — antes `/o` e `/listas` apareciam dentro do shell do app (menu lateral, busca). No protótipo são páginas públicas à parte.

- Novo grupo de rotas `src/app/(publico)` com cabeçalho próprio (marca, **Entrar**, **Criar conta grátis**; com sessão vira "Abrir o EncontraÊ"), rodapé (Termos, Privacidade) e aviso de cookies. Não mexe no shell.
- Oferta: foto 440 × 400 com selo "Oferta do dia", loja (avatar, bairro · distância), título 28 px, preço 32 px, painel vermelho com "Termina em" (HH:MM:SS) e validade, **Pegar cupom** âmbar de 48 px, grade **WhatsApp | Como chegar**, **Conversar**, faixa "Crie sua conta grátis…" (só visitante), "Mais desta loja", "Parecidos perto" em cartões de 160 px, **Denunciar**.
- Coluna lateral de 340 px: "Como este link aparece no WhatsApp" (imagem, título e descrição reais do item; o domínio só aparece com `NEXT_PUBLIC_SITE_URL`) e cartão azul "Criar conta grátis" (só visitante).
- Lista pública: mesma moldura; faixa "Ana te enviou isto" só quando a API traz o primeiro nome.
- Mensagens de erro de seção sem aviso técnico ("fonte de dados ainda não conectada" removido de `section-state.tsx`).

**Avaliar** — cartões brancos numerados (1 a 4), título 32 px + subtítulo, estrelas de 40 px com rótulo ("Sem nota", Péssimo…Incrível) colorido, quadrados tracejados 120 px "Adicionar foto 0/6" e "Adicionar vídeo opcional", comentário com placeholder, cartão 4 recolhível ("Toque para abrir" / resumo), atendimento e tempo de resposta em **estrelas** (eram bolinhas numeradas), chave (switch) de nome, barra inferior com "Nota ✓ · Fotos 0/2", modal de saída com **Descartar / Continuar editando / Salvar e sair** (faltava "Salvar e sair"), modal de sucesso com saudação, resumo e **Avaliar outro produto ou serviço** (faltava).

**Denunciar** — antes era um formulário com selects. Agora: chips de tipo, campo nome com rótulo por tipo, motivo em grade de 2 colunas, "Descreva o que aconteceu" com contador e mínimo, **Anexar print** (funcional: envia a imagem por URL assinada e manda `attachmentKey`; contrato em `docs/contratos/conta.md`), rodapé "A loja não fica sabendo…", tela de recebido com protocolo, Sobre/Motivo/Prazo e **Fazer outra denúncia**.

## O que ficou diferente (e por quê)

- **Menu lateral recolhido por padrão no protótipo** (72 px, só ícones); no app abre expandido (256 px) e o conteúdo fica mais estreito (Produto 1100 px × 1275 px no protótipo). Está no shell (agente "home-shell"). Com o menu recolhido o layout bate com o protótipo.
- **WhatsApp para visitante**: o protótipo pede conta para chamar no WhatsApp; o app mantém livre (regra do Documento de entrega: só o chat próprio pede conta).
- **Páginas /p, /l, /s para visitante**: o artboard Compartilhado tem variantes Produto, Loja e Prestador sem menu; no app essas rotas continuam dentro do shell (são as próprias telas de Produto/Loja/Prestador, com os mesmos botões). Só `/o` e `/listas` viraram página pública própria.
- **"Testar: Produto | Loja | Prestador | Oferta"** e o horário "10:42" da prévia são recursos só do protótipo: não existem.
- **Barra de progresso "Enviando 40 %"** nas fotos de avaliação: o upload por URL assinada não informa progresso; mostra "Enviando…".
- **Miniatura de vídeo com duração** na avaliação: o app mostra o ícone de vídeo e o estado do envio.
- **Legendas das fotos de trabalhos do prestador**: a API não traz legenda; não são exibidas.
- **Mapa** (loja, prestador, produto): painel estruturado, serviço de mapas ainda não escolhido.
- **CardB / CardServico / CardSizes**: pertencem ao `ResultCard`, que não foi editado aqui.

## Depende de back-end

`GET /offers/{slug}`, `GET /share/lists/{token}` (com `ownerFirstName`), `POST /uploads/presign` (purpose `help` para o print da denúncia), `POST /reports` com `attachmentKey` opcional, demais rotas do contrato `decidir.md`. Nada foi testado com a API real.

## Testado

Tipos, lint, 149 testes de lógica, navegador (Chromium) contra servidor de teste: layouts de desktop (1440) e celular (390) das seis rotas, sem rolagem horizontal e sem erros de código no console.
