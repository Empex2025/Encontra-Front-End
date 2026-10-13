/**
 * Decisão sobre cookies e medição (Documento de entrega › Home, regra do aviso de cookies).
 * Fica só neste navegador. Enquanto não houver decisão, o aviso aparece e **nenhum evento de uso é enviado**.
 * - "all": medição de uso liberada. - "necessary" (ou sem decisão): só o necessário; os eventos de uso não são enviados.
 */
export type CookieChoice = "all" | "necessary";

const KEY = "encontrae_cookies";
const EVENT = "encontrae:cookies";

export function readCookieChoice(): CookieChoice | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "all" || v === "necessary" ? v : null;
  } catch {
    return null;
  }
}

export function saveCookieChoice(choice: CookieChoice) {
  try {
    window.localStorage.setItem(KEY, choice);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeCookieChoice(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
