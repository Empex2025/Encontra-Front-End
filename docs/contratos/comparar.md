# Contrato — Comparar (`GET /comparisons/view`)

Proposta do front para combinar com o back-end. Baseada na Decisão 5 revisada (12/10/2026): **quem decide o que comparar é o usuário**. Não há catálogo canônico nem GTIN na 1ª versão.

## O que o back-end NÃO precisa criar

- Nenhuma entidade `Comparison` e nenhuma rota `/me/comparisons`. A lista de itens escolhidos (até 3, com a origem de cada um) fica **no navegador** da pessoa, logada ou visitante. É uma conveniência, não um dado da conta.
- Nenhum casamento de produtos entre lojas.

## Pedido

`GET /api/v1/comparisons/view` — **público** (visitante pode comparar).

| Parâmetro    | Tipo                                  | Observação                                                                        |
| ------------ | ------------------------------------- | --------------------------------------------------------------------------------- |
| `items`      | lista `tipo:id`, separada por vírgula | 2 ou 3 itens. `tipo` = `product` ou `service`. Ex.: `product:8f1c…,product:2b9a…` |
| `lat`, `lng` | número                                | ponto do usuário, para calcular a distância. Sem eles, a distância vem `null`     |

Erros (formato padrão `{ code, message }`):

| Status | `code`                   | Quando                                                       |
| ------ | ------------------------ | ------------------------------------------------------------ |
| 422    | `COMPARISON_TOO_MANY`    | mais de 3 itens                                              |
| 422    | `COMPARISON_MIXED_GROUP` | itens de grupos diferentes (ex.: cabeleireiro e eletricista) |

Itens que não existem mais (apagados ou desativados) **não dão erro**: voltam em `missing`.

## Resposta

```json
{
  "group": { "id": "tenis", "label": "Tênis", "kind": "product" },
  "criteria": [
    {
      "id": "price",
      "label": "Preço",
      "kind": "money",
      "better": "lower",
      "priority": { "badge": "Menor preço" }
    },
    {
      "id": "distance",
      "label": "Distância",
      "kind": "distance",
      "better": "lower",
      "priority": { "badge": "Mais perto" }
    },
    {
      "id": "rating",
      "label": "Avaliação",
      "kind": "rating",
      "better": "higher",
      "priority": { "badge": "Melhor avaliação" }
    },
    { "id": "store", "label": "Loja", "kind": "text", "better": null, "priority": null },
    { "id": "differs", "label": "O que diferencia", "kind": "text", "better": null, "priority": null }
  ],
  "items": [
    {
      "ref": "product:8f1c…",
      "type": "product",
      "id": "8f1c…",
      "slug": "tenis-corrida-x",
      "title": "Tênis de corrida X",
      "imageUrl": null,
      "profile": { "id": "…", "slug": "loja-a", "name": "Loja A", "kind": "store", "verified": true },
      "cells": {
        "price": { "text": "R$ 279,90", "detail": "de R$ 349,90", "value": 27990 },
        "distance": { "text": "2,4 km", "detail": null, "value": 2.4 },
        "rating": { "text": "4,8", "detail": "120 avaliações", "value": 4.8 },
        "store": { "text": "Loja A", "detail": null, "value": null },
        "differs": { "text": "Entrega no mesmo dia", "detail": null, "value": null }
      }
    }
  ],
  "missing": []
}
```

### Regras

- **Os critérios vêm do servidor**, configurados por grupo (cabeleireiros: Preço, Avaliação, Distância, Serviços, Experiência, Atende em domicílio, Horário, Responde em; tênis: Preço, Cupom da loja hoje, Desconto, Avaliação, Vendidos, Tamanhos disponíveis, Loja, Distância, Retirada e entrega, Pagamento…). O front só desenha o que vier. A ordem do array é a ordem das linhas.
- O **último critério é sempre `differs`** ("O que diferencia"): o front nunca o esconde.
- `kind`: `money` (centavos em `value`), `distance` (km), `rating` (0–5), `number`, `boolean` (`value` true/false; `text` "Sim"/"Não"), `text`.
- `better`: `lower` (ganha o menor), `higher` (ganha o maior) ou `null` (não compara).
- `priority`: se não for `null`, o critério pode ser marcado pela pessoa como prioridade (até 3) e `badge` é o selo do vencedor ("Menor preço", "Mais perto", "Melhor avaliação", "Mais serviços", "Mais experiência", "Mais rápido", "Mais vendido", "Maior desconto").
- `cells[critério]`: `text` é o texto principal já formatado (pt-BR); `detail` é o complemento ("de R$ 349,90", "com cupom: R$ 251,91 · código ESPORTE10"); `value` é o número usado para decidir o vencedor. `text: null` = **informação não disponível** (o front mostra "Não informado"; nunca invente valor).
- **O destaque é decidido no front**, só nos critérios que a pessoa marcou e só se os valores forem diferentes. Empate: todos os empatados ganham o selo. O servidor não escolhe vencedor.
- Todos os itens de uma resposta pertencem ao mesmo `group`. `group.id` é o mesmo `group.id` que vem em cada item de `GET /search` (campo novo `group`, abaixo).

## Mudança em `SearchItem` (contrato da busca)

Para o botão "Comparar" saber o grupo sem outra chamada, cada item de `GET /search` ganha:

```json
"group": { "id": "tenis", "label": "Tênis" }
```

`null` quando o item não pertence a nenhum grupo comparável (aí o front não mostra o botão). O grupo é **mais fino que as 12 categorias**: "Cabeleireiros" e "Eletricistas" são ambos da categoria Serviços, mas não se comparam.

## Dados que já existem e alimentam o quadro

Preço e data da atualização, loja/prestador, distância, nota e avaliações, disponibilidade, vendidos, horário, atende em domicílio. Nada novo precisa ser coletado do lojista para a comparação funcionar; critérios sem dado aparecem como "Não informado".

## Extensões da fidelidade ao protótipo (16/10/2026)

Aditivas e opcionais.

- **`GET /search` na tela de seleção:** novos filtros `comparable=1` (só itens com `group`), `hasDiscount=1`, `openNow=1`, `serviceMode=home`, `verified=1`; `sort` aceita também `price_desc` (maior preço) e `sold` (mais vendidos). A resposta ganha `related: string[]` (buscas relacionadas; padrão `[]`, a linha some sem dados).
- **`GET /comparisons/view`:** cada item pode trazer `card` (um `SearchItem` completo) para o quadro mostrar o mesmo cartão da pesquisa. Sem `card`, o quadro usa o cartão enxuto com os dados da comparação.
- A seleção (até 3, mesmo `group`) continua no navegador; cada entrada guarda um instantâneo (`title`, `imageUrl`, `priceCents`, `categoryId`) só para desenhar a bandeja "Sua comparação" sem nova chamada.
- Rota do quadro: `/comparar/quadro`; a seleção/pesquisa fica em `/comparar?q=`.
