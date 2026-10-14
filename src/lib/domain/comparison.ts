import type { Cell, ComparedItem, Criterion } from "@/lib/api/comparison";

/** Regras do quadro de comparação (Documento de entrega › Comparar). Sem tela, sem rede: só lógica. */

export const MAX_COMPARE = 3;
export const MIN_COMPARE = 2;
export const MAX_PRIORITIES = 3;
/** Critério que fecha o quadro e nunca é escondido por "só o que é diferente". */
export const DIFFERS_ID = "differs";

export type CompareGroup = { id: string; label: string };
export type CompareEntry = { ref: string; group: CompareGroup; origin: string };

export type AddResult = "added" | "removed" | "full" | "other_group";

/** Alterna um item na lista: já está → remove; outro grupo → recusa; cheia → recusa. */
export function toggleEntry(
  list: readonly CompareEntry[],
  entry: CompareEntry,
): { result: AddResult; list: CompareEntry[] } {
  if (list.some((e) => e.ref === entry.ref)) {
    return { result: "removed", list: list.filter((e) => e.ref !== entry.ref) };
  }
  if (list.length > 0 && list[0].group.id !== entry.group.id)
    return { result: "other_group", list: [...list] };
  if (list.length >= MAX_COMPARE) return { result: "full", list: [...list] };
  return { result: "added", list: [...list, entry] };
}

/** Estado do botão "Comparar" de um item, sem precisar tentar adicionar. */
export function buttonState(list: readonly CompareEntry[], ref: string, groupId: string) {
  if (list.some((e) => e.ref === ref)) return "in" as const;
  if (list.length > 0 && list[0].group.id !== groupId) return "other_group" as const;
  if (list.length >= MAX_COMPARE) return "full" as const;
  return "can_add" as const;
}

export const itemRef = (type: "product" | "service", id: string) => `${type}:${id}`;

const same = (a: Cell | undefined, b: Cell | undefined) =>
  (a?.text ?? null) === (b?.text ?? null) && (a?.detail ?? null) === (b?.detail ?? null);

/** Linha em que todos os itens têm o mesmo valor. */
export function isEqualRow(criterion: Criterion, items: readonly ComparedItem[]) {
  const first = items[0]?.cells[criterion.id];
  return items.every((it) => same(it.cells[criterion.id], first));
}

/**
 * Quem ganha em cada critério marcado como prioridade.
 * Só conta critério com `better`, com valor numérico em pelo menos 2 itens e valores diferentes.
 * Empate: todos os empatados ganham. Sem prioridade, nenhum destaque.
 */
export function computeWinners(
  criteria: readonly Criterion[],
  items: readonly ComparedItem[],
  priorities: readonly string[],
): Record<string, string[]> {
  const winners: Record<string, string[]> = {};
  for (const id of priorities) {
    const c = criteria.find((x) => x.id === id);
    if (!c || !c.better || !c.priority) continue;
    const scored = items
      .map((it) => ({ ref: it.ref, v: it.cells[id]?.value }))
      .filter((x): x is { ref: string; v: number } => typeof x.v === "number");
    if (scored.length < 2) continue;
    const values = scored.map((x) => x.v);
    const best = c.better === "lower" ? Math.min(...values) : Math.max(...values);
    if (values.every((v) => v === best)) continue;
    winners[id] = scored.filter((x) => x.v === best).map((x) => x.ref);
  }
  return winners;
}

/** Linhas na ordem de exibição: prioridades marcadas sobem ao topo (na ordem em que foram marcadas). */
export function orderCriteria(criteria: readonly Criterion[], priorities: readonly string[]) {
  const picked = priorities.map((id) => criteria.find((c) => c.id === id)).filter((c): c is Criterion => !!c);
  const rest = criteria.filter((c) => !priorities.includes(c.id));
  return [...picked, ...rest];
}

/** Marca ou desmarca uma prioridade, respeitando o máximo. */
export function togglePriority(current: readonly string[], id: string) {
  if (current.includes(id)) return { list: current.filter((x) => x !== id), limitReached: false };
  if (current.length >= MAX_PRIORITIES) return { list: [...current], limitReached: true };
  return { list: [...current, id], limitReached: false };
}
