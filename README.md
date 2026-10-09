# EncontraÊ — Front-end do consumidor

App web do consumidor da EncontraÊ (Next.js 16 + React 19 + TypeScript + Tailwind CSS 4).
A fonte das telas, regras e chamadas é o **Documento de entrega EncontraÊ – consumidor**.

## Rodar

```bash
cp .env.example .env.local   # aponte BACKEND_URL para o back-end
npm install
npm run dev                  # http://localhost:3000
```

Sem `BACKEND_URL`, as telas abrem, mas mostram os estados de "sem conexão" / visitante: não há dados simulados.

| Comando | O que faz |
|---|---|
| `npm run dev` | ambiente de desenvolvimento |
| `npm run build` / `npm start` | versão de produção |
| `npm run typecheck` | confere os tipos |
| `npm run lint` | confere o código |
| `npm run format` | formata os arquivos |

## Como o projeto está organizado

```
src/
  app/                  rotas (App Router)
    (app)/              telas com cabeçalho, menu lateral e rodapé
    (conta-acesso)/     entrar, cadastro, recuperar senha (sem menu)
    globals.css         tokens do Design System (claro e escuro)
  components/
    layout/             cabeçalho, local e raio, busca, menu lateral, barra inferior, rodapé
    ui/                 peças pequenas reutilizáveis
  hooks/                sessão, local do usuário, tema
  lib/
    api/                cliente da API, schemas (Zod) e chamadas
    domain/             regras fixas do produto: 12 categorias (CAT12), escala de raio
    routes.ts           endereços das telas
```

## Convenções

- **API:** tudo em `/api/v1`, repassado ao back-end pelo `next.config.ts` (`BACKEND_URL`). Toda resposta é conferida com Zod antes de usar. Erros chegam como `{ code, message, fields? }`.
- **Cores:** use os nomes de papel (`bg-surface`, `text-text-muted`, `bg-primary`…). Eles trocam sozinhos no modo escuro. Cores de categoria: `var(--cat-<id>)`.
- **Raio:** só 1, 3, 5, 10, 20 ou 50 km; padrão 50 km.
- **Acessibilidade:** HTML semântico, foco visível, áreas de toque de 44 px, textos de erro claros.
- **Navegador:** `localStorage` só para conveniências (tema, menu recolhido, histórico de busca, local do visitante). Dados da conta vêm sempre da API.
