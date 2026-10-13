import type { SavedComparison } from "@/lib/api/me";

import { type CompareEntry, MAX_COMPARE } from "./comparison";

const NAME_MAX = 60;

/** Nome automático da comparação salva: "Tênis X × Tênis Y", cortado em 60 caracteres. */
export function defaultComparisonName(titles: readonly string[], groupLabel: string): string {
  const joined = titles
    .map((t) => t.trim())
    .filter(Boolean)
    .join(" × ");
  const base = joined || `Comparação de ${groupLabel}`;
  return base.length > NAME_MAX ? `${base.slice(0, NAME_MAX - 1).trimEnd()}…` : base;
}

/** Comparação salva → itens da seleção do navegador (até 3; origem "conta"). */
export function savedToEntries(saved: SavedComparison): CompareEntry[] {
  return saved.items
    .slice(0, MAX_COMPARE)
    .map((it) => ({ ref: it.ref, group: saved.group, origin: "conta" }));
}
