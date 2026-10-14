/**
 * Texto digitado por quem ainda não entrou (resposta de story, comentário de live).
 * Fica só nesta aba, enquanto a pessoa entra na conta; volta uma vez e é apagado.
 */
const PREFIX = "encontrae_rascunho_texto:";

export const textDraftKey = (scope: string) => `${PREFIX}${scope}`;

export function saveTextDraft(scope: string, text: string) {
  try {
    window.sessionStorage.setItem(textDraftKey(scope), text);
  } catch {}
}

/** Lê e apaga o rascunho. Devolve só texto não vazio, cortado em `max`. */
export function takeTextDraft(scope: string, max: number): string | null {
  try {
    const raw = window.sessionStorage.getItem(textDraftKey(scope));
    window.sessionStorage.removeItem(textDraftKey(scope));
    const text = (raw ?? "").slice(0, max);
    return text.trim() ? text : null;
  } catch {
    return null;
  }
}

/** Só olha, sem apagar (para saber onde voltar). */
export function peekTextDraft(scope: string): string | null {
  try {
    return window.sessionStorage.getItem(textDraftKey(scope));
  } catch {
    return null;
  }
}
