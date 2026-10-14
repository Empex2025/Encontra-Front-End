# Roteiro de teste — Entrada, conta e institucional

Para testar no navegador. Endereço base: o do site (ex.: `http://localhost:3000`).
"Sem back-end" = o servidor de dados não está ligado. "Com dados" = o back-end responde.

## Regra geral

- Nenhuma tela pode ficar em branco nem mostrar "em breve" ou "em construção".
- Erro do servidor mostra aviso com o botão **Tentar de novo**. Nunca parece "vazio".

## 1. /boas-vindas

- Sem back-end: 3 telas curtas (Próximo, Voltar, Pular). Última tela: "Começar" (ou "Começar a explorar" + "Criar conta" para visitante).
- Celular: botões grandes, sem rolagem lateral.

## 2. /entrar

- Campos "CPF ou e-mail" e "Senha", "Manter conectado", "Esqueci minha senha", "Cadastre-se", "Explorar sem cadastro".
- Embaixo: link "Precisa de ajuda para entrar? Central de Ajuda" (não existe mais texto de lojista).
- Sem back-end: ao entrar aparece mensagem de erro em vermelho.
- Com dados: senha errada mostra o erro; senha certa leva para a tela de onde você veio.

## 3. /entrar/recuperar

- Etapas de recuperação de senha. Sem back-end, o erro aparece na etapa.

## 4. /cadastro (4 etapas)

1. Dados: clique em "Próximo" vazio, devem aparecer erros em todos os campos. Preencha (CPF válido) e avance.
2. Código: 6 caixas + "Verificar". Código errado mostra erro; certo avança.
3. Local: "Estado" começa em "Escolha o estado" (obrigatório). Digitar o CEP preenche bairro, cidade e estado.
4. Interesses: precisa de 3. Com 2, aparece o aviso.

- Botão voltar do navegador volta uma etapa. Fim: "Tudo pronto" com o resumo.
- Sem back-end: já na etapa 1 o envio mostra erro.

## 5. Retomar ação depois do login

- Como visitante, abra `/ofertas`, escolha um local e clique em **Quero em promoção**.
- Aparece o convite. Clique em "Já tem conta? Entrar" (o convite fecha). Entre.
- Você volta para `/ofertas` e o pedido "Quero em promoção" reabre sozinho. Vale também na página de um produto.

## 6. /visitante

- Duas listas: "Liberado sem conta" e "Pede para entrar", com botões Criar conta e Entrar.

## 7. /conta (precisa de conta)

- Visitante: "Entre para acessar sua conta".
- Sem back-end: "Não foi possível confirmar sua sessão" + Tentar de novo (não pede login falsamente).
- Com dados, abas: Perfil, Endereços, Interesses, Notificações, Privacidade e segurança, Configurações, mais "Sair".
- Contadores (Favoritos, Seguindo, Alertas) mostram "—" quando não vieram do servidor.
- Se só o perfil falhar: Perfil mostra erro com Tentar de novo; em Configurações, Aparência, Idioma e Sobre continuam; em Privacidade, só o bloco "Privacidade" mostra erro.
- Cartão "Tem um negócio?": texto neutro com link "fale com a gente" (leva à Ajuda > Fale conosco).
- Excluir conta: Privacidade e segurança > "Excluir conta" (3 passos).
- Celular: as abas rolam para o lado dentro da própria faixa.

## 8. /ajuda

- Perguntas frequentes: busca e filtro "Todas" sempre visíveis. Sem back-end: aviso "Não foi possível carregar as perguntas frequentes" + Tentar de novo.
- Com dados: perguntas abrem e fecham; "Esta resposta ajudou?".
- "Fale conosco": formulário completo. "Outros canais" mostra "Informação indisponível no momento" sem dados.

## 9. /institucional e /institucional/{sobre, termos, privacidade, cookies, avaliacoes}

- O menu e o título do documento aparecem sempre.
- Sem back-end: "Não foi possível carregar este documento" + Tentar de novo (não aparece texto jurídico inventado).
- Documento que o servidor ainda não tem: "Texto ainda não publicado".
- Cookies: os controles (Desempenho, Personalização, Salvar escolha) funcionam mesmo sem back-end.
- Endereço inexistente (`/institucional/xyz`): página 404.

## 10. Telas de sistema

- 404: abra `/qualquer-coisa`. Mostra botões e o bloco "Que tal ver isto?" (explica quando não há sugestões).
- Erro 500: tela "Algo deu errado do nosso lado" com Tentar de novo.
- Sem internet: desligue a rede; aparece a faixa vermelha "Ainda sem conexão".
- Manutenção: quando o servidor responde 503 MAINTENANCE, tela "Voltamos em instantes".

## 11. Rodapé

- Links: Como funciona, Central de Ajuda, Termos de Uso, Privacidade, Cookies. Sem "Área do lojista".
