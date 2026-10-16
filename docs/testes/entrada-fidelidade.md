# Roteiro — fidelidade da Entrada ao protótipo (1440 px e 390 px)

Abrir o app e o artboard lado a lado. Sem sessão, com a API respondendo.

| Rota do app | Artboard (.dc.html) | Conferir |
|---|---|---|
| `/boas-vindas` | BoasVindas | slides, pular, "Começar" |
| `/entrar` | CadLogin | campos 44 px, erro ao clicar em Entrar vazio, mostrar senha, "Manter conectado", Google/Apple desabilitados com aviso |
| `/cadastro` (etapa 1) | CadDados | erros de campo ao clicar em Próximo, termos, etapa 1 de 4 |
| `/cadastro` (etapa 2) | CadCodigo | 6 caixas, reenviar após 60 s, tentativas restantes |
| `/cadastro` (etapa 3) | CadLocal | CEP, UF, usar minha localização |
| `/cadastro` (etapa 4) | CadInteresses | 12 categorias, mínimo exigido |
| `/cadastro` (fim) | CadPronto | resumo e "Começar" |
| `/entrar/recuperar` | CadRecuperar | canal SMS/e-mail, código, nova senha |
| `/visitante` | Visitante | 7 itens liberados, 8 que pedem conta (abrem o convite), caixa "Regras" |
| qualquer página, visitante | Visitante (faixa azul) | faixa no topo, sem cobrir conteúdo |
| Menu: Conversas, Notificações, Favoritos, Conta | Visitante (convite) | pop-up "Entre para…" com texto da ação |

Também: modo escuro, celular sem rolagem horizontal, `?voltar=` (portão do visitante, cadastro, boas-vindas, destino).
