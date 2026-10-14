/** Texto sem acento e em minúsculas, para a busca ignorar maiúsculas e acentos. */
export const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Busca vazia aceita tudo; senão basta um dos campos conter o termo. */
export function matches(term: string, ...fields: (string | null | undefined)[]) {
  const t = normalize(term.trim());
  return !t || fields.some((f) => !!f && normalize(f).includes(t));
}
