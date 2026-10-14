@AGENTS.md

# EncontraÊ — front-end do consumidor

Leia antes de qualquer mudança:

- @docs/DIRETRIZES.md — visão do negócio e regras de engenharia (fonte das decisões).
- @docs/STATUS.md — matriz de estado; atualize a cada entrega.

Regras rápidas:

- Sem dados simulados na aplicação. Mocks só em testes isolados.
- Contratos da API: `/api/v1`, conforme o "Pedido ao back-end" do Documento de entrega. Valide toda resposta com Zod.
- Cores por papel (`bg-surface`, `text-text-muted`…), raio só 1/3/5/10/20/50 km (padrão 50), 12 categorias (CAT12).
- Cada fluxo numa branch própria, com PR para revisão.
