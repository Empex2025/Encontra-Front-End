# Contrato — cartão do pedido na conversa

Proposta do front (rotas ainda não publicadas). `GET /conversations/{id}` ganha `request` (opcional):

```json
{ "request": { "id": "…", "kind": "booking", "title": "Troca de tomada",
  "rows": [{ "label": "Dia e horário", "value": "sex., 24 de outubro às 09:00" }, { "label": "Onde", "value": "Na sua casa" }],
  "status": "open", "rating": null, "tags": [] } }
```

- `kind`: `booking` (horário agendado), `quote` (orçamento), `service` (solicitação), `product` (produto combinado).
- `status`: `open` · `rescheduling` · `cancelled` · `done` (cliente confirmou) · `rated`.
- Ações do cliente, sem custo, prazo mínimo ou multa (a plataforma não tem pagamento): `POST /conversations/{id}/request/{done|reschedule|cancel}`. O servidor avisa a outra parte e registra a mensagem na conversa ("Cancelei o horário…", "Recebi o produto, obrigado!").
- Nota em 1 toque: `PUT /conversations/{id}/request/rating` com `{ rating: 1..5, tags: string[] }`. Comentário escrito continua na tela Avaliar.
- Quem confirma a conclusão é sempre o cliente; loja e prestador não confirmam entrega nem serviço feito.
- A confirmação só prova que houve conversa, não que houve compra: o servidor decide se libera a avaliação (ex.: exigir troca de mensagens).
- Lógica em `src/lib/domain/order-card.ts` (testada); tela em `src/components/chat/order-card.tsx`.
- Pendente (lado do prestador): "Confirmar horário", "Não posso atender", "Enviar valor e prazo" ficam no painel do lojista.
