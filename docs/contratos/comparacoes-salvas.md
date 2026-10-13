# Contrato — Comparações salvas na conta

Decisão dos fundadores (13/10/2026): "Salvar comparação" grava na conta. Só quem tem login salva (visitante vê o convite). A seleção em andamento continua no navegador; só o que a pessoa **salva** vai para a conta.

- `GET /api/v1/me/comparisons` → `{ items: [{ id, name, createdAt, group: { id, label }, items: [{ ref: "product:ID"|"service:ID", title, imageUrl|null }] (2 a 3) }] }`, mais recentes primeiro.
- `POST /api/v1/me/comparisons` `{ name ≤ 60, items: ["product:ID", …] (2 a 3, mesmo grupo) }` → a comparação criada (201). Erros: 422 `COMPARISON_MIXED_GROUP`, 422 `COMPARISON_LIMIT` (limite sugerido: 20 por pessoa).
- `DELETE /api/v1/me/comparisons/{id}` → 204.
- O front gera o nome ("Tênis X × Tênis Y"); item que deixou de existir some da lista ao abrir (já tratado por `missing` em `GET /comparisons/view`).
- Aparece em Favoritos › Listas › "Comparações salvas".
