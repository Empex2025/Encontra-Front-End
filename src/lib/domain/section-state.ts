export type SectionState = "idle" | "loading" | "error" | "empty" | "ready";

/** Estado de uma seção alimentada por uma consulta: erro nunca se confunde com vazio. */
export function sectionState(
  q: { isPending: boolean; isError: boolean },
  enabled: boolean,
  count: number,
): SectionState {
  if (!enabled) return "idle";
  if (q.isError) return "error";
  if (q.isPending) return "loading";
  return count > 0 ? "ready" : "empty";
}
