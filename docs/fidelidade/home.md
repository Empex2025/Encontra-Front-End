# Fidelidade ao protótipo — Home e estrutura global (`home-shell`)

Branch: `fix/fidelidade-home`. Comparação em 1440 px (artboard HomeV2) e 390 px. Roteiro de teste: `docs/testes/home.md`.

## Artboard × rota

| Artboard | Rota | Partes comparadas |
|---|---|---|
| HomeV2 | `/` | Busca, atalhos, categorias, mapa, Stories, 4 blocos com abas, Meu Radar, Radar do bairro |
| Shell (todos os artboards) | todas em `(app)` | Cabeçalho 84 px, menu lateral, rodapé, aviso de cookies, barra inferior do celular, faixa de visitante |

## Diferenças encontradas

1. Busca com um campo e seletor de local separado; o protótipo tem dois campos e botão âmbar "Buscar".
2. Mapa no fim da página; no protótipo vem logo depois das categorias.
3. Categorias sem "Novidades".
4. Blocos sem abas nem setas; cartões fora do padrão CardB / CardSizes / CardServico.
5. Menu lateral fixo ocupando largura; protótipo recolhido (72 px) que abre por cima (280 px).
6. Rodapé e aviso de cookies fora do padrão; Stories, Meu Radar e Radar do bairro sem a estrutura do protótipo.

## O que ficou igual

- Ordem da página, largura de 1280 px com 80 px de margem, tipografia e alturas do hero, categorias (círculos de 72 px), Stories (112 px), cartões.
- Busca em dois campos com painel de recentes (Limpar, ×), populares e sugestões; campo de local com "Usar minha localização atual" e sugestões; o local escolhido vale para Home e Explorar.
- Novidades (destacada) + divisor + 12 categorias (CAT12).
- Mapa de Resultados após as categorias; chip "Todos · N locais perto de você" só com `mapTotal` real; "Abrir mapa completo".
- Blocos com abas, contador, setas e "Ver todos"; cartões vertical (Acontecendo), produto, serviço e experiência.
- Menu lateral: ícones, abrir ao passar o mouse/foco, "Fixar menu aberto", bolinhas (recolhido) e contadores (aberto).
- Rodapé azul "Como Funciona / Suporte"; cookies no canto superior direito; faixa de visitante; Meu Radar em painel azul com "Marcar tudo como visto".

## O que continua diferente e por quê

- Cabeçalho segue fixo no topo (decisão de usabilidade já aceita).
- Categorias navegam para o Explorar em vez de trocar o modo do mapa: o mapa está bloqueado (serviço de mapas não escolhido). O mapa é um espaço com aviso, controles desabilitados.
- Rodapé sem "em breve", redes sociais e Área do Lojista: só aparecem com `NEXT_PUBLIC_*_URL` configuradas.
- Cartão mostra só o bairro quando a cidade não vem; linhas somem quando o servidor não envia o dado (regra de dado honesto).
- Link "Ver todos" nos blocos foi acrescentado (leva ao Explorar já filtrado).
- Altura total da página: 5151 px contra 5330 px no protótipo (sem dados de demonstração).
- Barra inferior do celular e `error-state`: sem diferenças de shell encontradas além do já descrito; não houve revisão pixel a pixel.

## Depende do back-end

`GET /discovery/home?section&tab&page&limit`, `mapTotal`, campos opcionais dos itens (`viewCount`, `specialties`, `serviceNote`, `scheduleLabel`, `favorited`, `profile.avatarUrl`), `live` nos grupos de Stories, `headline` e `series` em preços do radar, serviço de mapas.

## Testado

Tipos, lint (arquivos tocados), 156 testes, e navegador contra servidor de teste isolado (ordem, busca, abas, setas, categorias, menu, logado, celular sem rolagem horizontal). Não validado com a API real.
