# Roteiro — Conta, Ajuda, Institucional e Estados (fidelidade ao protótipo)

Abra o app e o protótipo lado a lado (1440 px). Protótipo: `http://localhost:3450/<Artboard>.dc.html`.

| Tela no app                                                                                  | Artboard                           | O que conferir                                                                                        |
| -------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/conta` (cada aba: perfil, endereços, interesses, notificações, privacidade, configurações) | Conta                              | cartão azul do perfil, abas, cartões, interruptores 44x26, exclusão de conta em 3 passos              |
| `/ajuda` e `/ajuda?aba=contato`                                                              | Ajuda                              | cabeçalho azul com busca, categorias, perguntas, banner "Não encontrou", formulário e "Outros canais" |
| `/institucional/{sobre,termos,privacidade,cookies,avaliacoes}` e `/denunciar`                | Institucional                      | índice com barra âmbar, artigo, rodapé "Ainda tem dúvidas?", controles de cookies                     |
| Qualquer endereço inexistente (ex. `/xyz`)                                                   | Estados › Página não encontrada    | ícone 96 px, "ERRO 404", botões, sugestões                                                            |
| `/o/<slug-inexistente>`                                                                      | Estados › Oferta encerrada         | cartão central                                                                                        |
| Desligar a rede com o app aberto                                                             | Estados › Sem internet             | faixa escura fixa com "Tentar de novo"                                                                |
| Servidor respondendo 503 MAINTENANCE                                                         | Estados › Manutenção               | "Voltamos em instantes", previsão (se houver)                                                         |
| Erro de renderização                                                                         | Estados › Erro ao carregar         | "Tentar de novo" e "Falar com o suporte"                                                              |
| `/conversas`, `/notificacoes`, `/atividade`                                                  | Conversas, Notificacoes, Atividade | já conferidos em `docs/fidelidade/guardar.md`                                                         |

Diferenças conhecidas: rodapé e cabeçalho (fora deste fluxo); a lista de "salvos" da tela sem internet não existe (sem cache offline).
