/**
 * Ao sair da conta (Fluxo 5): apaga o que é da pessoa neste navegador.
 * Ficam o tema, a escolha de cookies, o modo do WhatsApp e o aviso de exclusão agendada.
 */
const EXACT = ["encontrae_local", "encontrae_busca_hist", "encontrae_comparacao", "encontrae_vistos"];
const PREFIXES = ["encontrae_rascunho_"];

export function clearLocalState() {
  try {
    const ls = window.localStorage;
    const keys = Array.from({ length: ls.length }, (_, i) => ls.key(i)).filter((k): k is string => !!k);
    for (const k of keys) if (EXACT.includes(k) || PREFIXES.some((p) => k.startsWith(p))) ls.removeItem(k);
  } catch {}
  try {
    window.sessionStorage.clear();
  } catch {}
}
