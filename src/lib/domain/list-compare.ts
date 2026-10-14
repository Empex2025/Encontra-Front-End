import type { CompareEntry } from "./comparison";
import { MAX_COMPARE, MIN_COMPARE } from "./comparison";

type Item = {
  id: string;
  type: "product" | "service" | "place";
  group?: { id: string; label: string } | null;
};

/**
 * "Comparar N desta lista": o grupo mais frequente, se tiver ≥ 2 itens; leva até 3 e substitui a comparação atual.
 * Empate: vence o grupo que aparece primeiro na lista.
 */
export function listCompareEntries(items: readonly Item[], origin: string): CompareEntry[] {
  const groups = new Map<string, { label: string; refs: string[] }>();
  for (const it of items) {
    if (it.type === "place" || !it.group) continue;
    const g = groups.get(it.group.id) ?? { label: it.group.label, refs: [] };
    g.refs.push(`${it.type}:${it.id}`);
    groups.set(it.group.id, g);
  }
  let best: { id: string; label: string; refs: string[] } | null = null;
  for (const [id, g] of groups) if (!best || g.refs.length > best.refs.length) best = { id, ...g };
  if (!best || best.refs.length < MIN_COMPARE) return [];
  return best.refs
    .slice(0, MAX_COMPARE)
    .map((ref) => ({ ref, group: { id: best.id, label: best.label }, origin }));
}
