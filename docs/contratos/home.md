# Contrato — Home (`GET /discovery/home`)

Proposta do front para combinar com o back-end. Base: Fluxo 2 do Documento de entrega e `docs/DIRETRIZES.md` §8 ("não inventar conteúdo para preencher seção").

## Pedido

`GET /api/v1/discovery/home` — **público** (visitante vê).

| Parâmetro    | Tipo                  | Observação                                                     |
| ------------ | --------------------- | -------------------------------------------------------------- |
| `lat`, `lng` | número                | ponto do usuário (GPS ou do endereço). Se faltar, usar `where` |
| `where`      | texto                 | bairro/cidade digitado; o servidor converte em ponto           |
| `radiusKm`   | 1, 3, 5, 10, 20 ou 50 | raio do usuário                                                |

## Resposta

```json
{
  "sections": [
    {
      "id": "happening",
      "items": [
        { "...SearchItem": "igual ao de GET /search", "reason": { "code": "closest", "label": "Mais perto" } }
      ],
      "total": 12
    },
    { "id": "products", "items": [], "total": 0 },
    { "id": "services", "items": [], "total": 0 },
    { "id": "experiences", "items": [], "total": 0 }
  ]
}
```

- `id` ∈ `happening` (ao vivo, promoções e ofertas, menores preços), `products`, `services`, `experiences` (bares, restaurantes, eventos). Cada seção traz **até 6 itens**; `total` é quantos existem no raio (o front mostra "Ver todos (N)" e leva ao Explorar).
- Cada item é o `SearchItem` já definido em `docs/contratos/busca.md` (inclui `sponsored`, `live`, `status`, `price.updatedAt`). Patrocinado aparece misturado e sempre com `sponsored: true`.
- `reason` (opcional, `null` se não houver motivo verdadeiro): `code` ∈ `following`, `closest`, `trending`, `alert`, `below_average`, `new`, `searched`, `nearby`; `label` já em português. **O servidor decide pelo estado da sessão**: para visitante, `following`, `alert` e `searched` viram `nearby` ("Perto de você"). O front só exibe o `label`.
- Seção sem itens pode vir vazia ou ser omitida; o front **oculta** seção vazia e nunca preenche com exemplo.
- Não resolvido aqui (rotas separadas, fase seguinte): Stories (`GET /stories?preview=1`), Meu Radar (`GET /me/radar`), Radar do bairro (`GET /discovery/trending`, `GET /discovery/prices`).

## Erros

Formato padrão `{ code, message }`. 422 `LOCATION_REQUIRED` quando não há `lat/lng` nem `where`.

## Regras de dados (importantes para a confiança)

- "Menor preço" e "abaixo da média" só com preços atualizados; o item traz `price.updatedAt`.
- Distância só se o servidor puder calcular; senão `distanceKm: null` (o card mostra "distância indisponível").
- `reason.code = "below_average"` exige base de comparação real (mesmo grupo, mesmo raio); sem base, não enviar o motivo.
