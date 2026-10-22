@AGENTS.md

# EncontraÊ — front-end do consumidor

Leia antes de qualquer mudança:

- @docs/DIRETRIZES.md — visão do negócio e regras de engenharia (fonte das decisões).
- @docs/STATUS.md — matriz de estado; atualize a cada entrega.

Regras rápidas:

- Sem dados simulados na aplicação. Mocks só em testes isolados.
- Contratos da API: `/api/v1`, conforme o "Pedido ao back-end" do Documento de entrega. Valide toda resposta com Zod.
- Cores por papel (`bg-surface`, `text-text-muted`…), raio só 1/3/5/10/20/50 km (padrão 50), 12 categorias (CAT12).
- Sem contagem de vendas ou serviços feitos (não há gateway de pagamento): o sinal de popularidade e confiança é a **quantidade de avaliações** ("Mais avaliados", "(126 avaliações)").
- Cada fluxo numa branch própria, com PR para revisão.
