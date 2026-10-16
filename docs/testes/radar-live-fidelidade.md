# Roteiro de conferência — Home (abaixo do mapa), Stories, Ao vivo, Evento, Produto, Loja, Prestador, Avaliar, Compartilhado

Compare o app (`http://localhost:3000`, ou o endereço de teste) com o protótipo (artboard indicado), em 1440 px.

| App | Artboard | O que conferir |
|---|---|---|
| `/` (abaixo do mapa) | HomeV2 | Faixa **Stories**: cartão branco, "Ver todos" âmbar, atalho "Perto agora" pulsando, círculos de 112 px (anel azul = não segue, âmbar = segue, vermelho = ao vivo; tracejado cinza e "visto" = já visto; contador só em quem tem mais de 1 story). |
| `/` | HomeV2 | **Meu Radar** (bloco azul-marinho): título 30/38, abas na ordem Tudo · Preços · Novidades · Quem você segue · Alertas, itens de 64 px (avisos já vistos ficam mais apagados e sem a bolinha), "Marcar tudo como visto" com aviso "Tudo visto…". |
| `/` | HomeV2 | **Radar do bairro**: faixa verde/vermelha, três colunas 1,15 : 1 : 1 (Preços com minigráfico e variação, Mais procurados, Lugares chamando atenção). |
| `/stories` | Stories | Cartão de oferta do story de serviço com um só botão ("Pedir orçamento"). |
| `/ao-vivo/{id}` | AoVivo | Linha "Voltar ao início" com 30 px; "Outras lives agora" com distância quando a API enviar. |
| `/eventos/{id}` | Evento | Seta de voltar em "chevron", hero logo abaixo. |
| `/p/{slug}`, `/l/{slug}`, `/s/{slug}`, `/avaliar`, `/o/{slug}` | Produto, LojaPerfil, PrestadorPerfil, Avaliar, Compartilhado | Sem mudanças de código nesta rodada; conferidos lado a lado, diferenças restantes só de dados (fotos, nomes). |
