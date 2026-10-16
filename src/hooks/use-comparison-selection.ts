"use client";

import { useCallback, useSyncExternalStore } from "react";
import { z } from "zod";

import { type AddResult, type CompareEntry, MAX_COMPARE, toggleEntry } from "@/lib/domain/comparison";

/**
 * Itens que a pessoa escolheu para comparar (até 3). Ficam só neste navegador, logada ou visitante:
 * é uma escolha passageira, não um dado da conta (docs/contratos/comparar.md).
 */
const KEY = "encontrae_comparacao";

const entrySchema = z.object({
  ref: z.string(),
  group: z.object({ id: z.string(), label: z.string() }),
  origin: z.string(),
  title: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  priceCents: z.number().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

const listeners = new Set<() => void>();
const EMPTY: CompareEntry[] = [];
let cache: { raw: string | null; list: CompareEntry[] } = { raw: null, list: EMPTY };

function read(): CompareEntry[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {}
  if (raw === cache.raw) return cache.list;
  let list = EMPTY;
  try {
    const parsed = z.array(entrySchema).safeParse(JSON.parse(raw ?? "[]"));
    if (parsed.success) list = parsed.data.slice(0, MAX_COMPARE);
  } catch {}
  cache = { raw, list };
  return list;
}

function write(list: CompareEntry[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useComparisonSelection() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = useCallback((entry: CompareEntry): AddResult => {
    const next = toggleEntry(read(), entry);
    if (next.result === "added" || next.result === "removed") write(next.list);
    return next.result;
  }, []);
  const remove = useCallback((ref: string) => write(read().filter((e) => e.ref !== ref)), []);
  const clear = useCallback(() => write([]), []);
  /** Troca a comparação inteira (ex.: "Comparar N desta lista"). */
  const replace = useCallback((entries: CompareEntry[]) => write(entries.slice(0, MAX_COMPARE)), []);

  return { list, toggle, remove, clear, replace };
}
