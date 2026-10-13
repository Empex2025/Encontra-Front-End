# Contrato — Lista compartilhada (página pública `/listas/{token}`)

Decisão dos fundadores (13/10/2026): quem recebe o link de uma lista abre uma página pública, sem conta.

## `POST /api/v1/me/lists/{id}/share` (já existia)
Resposta `{ "url": "https://…/listas/{token}" }`. O `token` é **longo e imprevisível** (não use o id da lista). Compartilhar de novo devolve o mesmo link; deve existir forma de **parar de compartilhar** (`DELETE /me/lists/{id}/share`, 204) que invalida o token.

## `GET /api/v1/share/lists/{token}` — público
```json
{ "name": "Presentes de Natal", "ownerFirstName": "Maria", "updatedAt": "2026-10-13T10:00:00Z",
  "items": [ "...SearchItem, igual ao de GET /search" ] }
```
- 404 quando o token não existe ou a lista deixou de ser compartilhada (a página mostra "Este link não está mais disponível").
- **Privacidade:** só o primeiro nome do dono (ou `null`); nada de e-mail, telefone, sobrenome, endereço. Itens indisponíveis ou removidos não entram.
- Os itens vêm no formato de busca, **sem dados da pessoa** (sem "favoritado em", sem preço ao salvar).
- A página usa `noindex`: lista de pessoa não aparece em buscadores.
- Comentários em lista compartilhada: **fora desta versão** (não definidos no documento; exigem moderação).
- Denúncia: `POST /reports` com `type: "lista"` e `targetId = token`.
