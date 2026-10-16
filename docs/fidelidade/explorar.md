# Fidelidade ao protótipo — Explorar e cartões de resultado

Branch: `fix/fid2-explorar`. Artboards: `Explorar` (estados: descoberta, busca, mapa, sem resultado) e `HomeV2` (blocos de cartões). Roteiro: `docs/testes/explorar-fidelidade.md`.

## Diferenças encontradas (antes)
1. Busca de um campo só; protótipo tem dois campos (O que você procura / Onde) com limpar, Cancelar e Buscar.
2. Linhas de lentes e "Filtrar" apareciam também na descoberta; no protótipo só existem depois de buscar, e só com os grupos úteis.
3. Seletor Grade/Mapa; protótipo tem Grade · Grade + mapa · Mapa.
4. Grade de 3–4 colunas com cartões de altura igual; protótipo usa mosaico de 5 colunas com fotos de alturas diferentes.
5. Cartões fora do padrão (chip "Comparar" em linha, selos em outros lugares, status em caixa); mapa em painel com cabeçalho próprio.
6. "Distância" em popover; protótipo usa janela com valor grande, barra e atalhos.
7. Sem resultado: faltava "Perguntar às lojas perto".
8. Cartão de experiência da Home sem o botão "mais" e com área clicável só embaixo; selo "N assistindo" cobria "AO VIVO".

## Não reproduzido (e por quê)
- Distância livre (digitar qualquer km, até 500): a escala do produto é 1/3/5/10/20/50 km.
- Pinos no mapa: dependem do serviço de mapas e de coordenadas reais.
- Cartões coloridos com iniciais e fotos fictícias: dado de demonstração do protótipo. Sem foto, o cartão usa o ícone da categoria.
- Botão "PROTÓTIPO · testar cenários": ferramenta do protótipo.
- Lente "ao vivo" por categoria (bolinha vermelha nas categorias): precisa de contagem por categoria no servidor.
- Modo padrão "Mapa" para buscas de lugar (palavras como "farmácia", "posto"): regra baseada em lista de palavras do protótipo, não adotada.
