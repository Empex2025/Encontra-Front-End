const KEY = "encontrae_busca_hist";
/** Guarda até 8 termos (Documento de entrega › Home, regra do histórico); as listas mostram os 5 mais recentes. */
export const HISTORY_MAX = 8;
export const HISTORY_SHOWN = 5;

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export function readHistory(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  } catch {}
}

/** Mais recente primeiro, sem repetir (ignora acento e maiúscula). Devolve a lista nova. */
export function mergeHistory(list: string[], term: string): string[] {
  const t = term.trim();
  if (!t) return list;
  return [t, ...list.filter((h) => norm(h) !== norm(t))].slice(0, HISTORY_MAX);
}

export function addToHistory(term: string): string[] {
  const next = mergeHistory(readHistory(), term);
  write(next);
  return next;
}

export function removeFromHistory(term: string): string[] {
  const next = readHistory().filter((h) => h !== term);
  write(next);
  return next;
}

export function clearHistory(): string[] {
  write([]);
  return [];
}
