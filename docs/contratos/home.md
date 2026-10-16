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

## Revisão de fidelidade ao protótipo (15/10/2026)

Mudanças propostas no mesmo `GET /discovery/home`; tudo é opcional e o front só mostra o que vier.

- **Abas e páginas dos blocos**: `GET /discovery/home?section={happening|products|services|experiences}&tab={id}&page={n}&limit={6|5}` devolve o mesmo formato, com **uma só seção** (`items` da página pedida e `total` das que existem na aba). `tab` é `all` (padrão, igual à resposta principal) ou um id fixo do front:
  - `happening`: `live`, `video`, `offers`, `price`
  - `products`: `esporte`, `moda`, `eletronicos`, `casa` (ids da CAT12)
  - `services`: `today` (disponível hoje), `casa`, `beleza`, `limpeza`, `auto`
  - `experiences`: `open` (aberto agora), `comer`, `beber`, `passeios`, `criancas`, `eventos`
  O servidor decide o que cada aba significa; a página 1 de `all` é a resposta principal (5 itens em Produtos, Serviços e Experiências; 6 em Acontecendo).
- **`mapTotal`** (número, na raiz): quantos lugares com coordenadas existem no raio. Alimenta o chip "Todos · N locais perto de você" do Mapa de Resultados. Ausente ou 0 = o chip não aparece.
- **Campos novos e opcionais em cada item** (`SearchItem`; valem também para `/search` e `/discovery/nearby`): `viewCount` (visualizações), `soldCount` (vendidos, produto), `doneCount` (serviços feitos), `specialties` (lista de textos), `serviceNote` ("até 8 km", "Salão próprio"), `scheduleLabel` ("Hoje, 20h", "Abre às 18h"), `favorited` (a conta já salvou) e `profile.avatarUrl`. Sem eles, o cartão simplesmente não mostra a linha.
- **Stories** (`GET /stories?preview=1`): campo opcional `live: { id }` no grupo (perfil ao vivo agora) para o selo "AO VIVO".
