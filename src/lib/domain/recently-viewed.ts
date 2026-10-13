/** "Vistos recentemente": até 20, sem repetir, mais novo primeiro. Só neste navegador (conveniência). */
export type ViewedRef = { type: "product" | "store" | "provider"; slug: string };
export const VIEWED_MAX = 20;
const KEY = "encontrae_vistos";

export function mergeViewed(list: ViewedRef[], ref: ViewedRef): ViewedRef[] {
  return [ref, ...list.filter((v) => !(v.type === ref.type && v.slug === ref.slug))].slice(0, VIEWED_MAX);
}

export function readViewed(): ViewedRef[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (x): x is ViewedRef =>
          !!x && typeof x.slug === "string" && ["product", "store", "provider"].includes(x.type),
      )
      .slice(0, VIEWED_MAX);
  } catch {
    return [];
  }
}

export function markViewed(ref: ViewedRef) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(mergeViewed(readViewed(), ref)));
  } catch {}
}
