"use client";

import { useQuery } from "@tanstack/react-query";
import { History, Search, TrendingUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useId, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { useDismiss } from "@/components/ui/use-dismiss";
import { endpoints, queryKeys } from "@/lib/api/endpoints";
import { addToHistory, HISTORY_SHOWN, readHistory, removeFromHistory } from "@/lib/domain/search-history";
import { explorarComBusca } from "@/lib/routes";

type Row = { text: string; hint?: string; kind: "hist" | "trend" | "sugg" };

/** Busca do cabeçalho: histórico, "Em alta perto de você" e sugestões enquanto digita. Leva para o Explorar. */
export function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const ref = useRef<HTMLFormElement>(null);
  const listId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);
  useDismiss(ref, open, close);

  const term = useDeferredValue(q.trim());
  const sugg = useQuery({
    queryKey: queryKeys.autocomplete(term),
    queryFn: () => endpoints.autocomplete(term),
    enabled: open,
  });

  const rows: Row[] = term
    ? (sugg.data?.items ?? []).map((s) => ({ text: s.text, hint: s.hint, kind: "sugg" }))
    : [
        ...history.map((t) => ({ text: t, kind: "hist" as const })),
        ...(sugg.data?.trending ?? []).map((t) => ({ text: t, kind: "trend" as const })),
      ];

  const go = (text: string) => {
    const t = text.trim();
    if (!t) return;
    addToHistory(t);
    setQ("");
    close();
    router.push(explorarComBusca(t));
  };

  const removeHist = (text: string) => {
    setHistory(removeFromHistory(text).slice(0, HISTORY_SHOWN));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || rows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % rows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(rows[active].text);
    }
  };

  const firstTrend = rows.findIndex((r) => r.kind === "trend");

  return (
    <form
      ref={ref}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(q);
      }}
      className={cn("relative", className)}
    >
      <label className="flex h-11 items-center gap-2 rounded-full border border-header-border bg-white/10 px-4 text-white focus-within:border-amber focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-amber/40">
        <Search className="size-4 shrink-0 text-navy-200" aria-hidden />
        <span className="sr-only">Buscar produtos, serviços e lojas</span>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value.slice(0, 80));
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            setHistory(readHistory().slice(0, HISTORY_SHOWN));
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open && rows.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          placeholder="O que você procura perto de você?"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-navy-200 focus-visible:outline-none"
        />
      </label>

      {open && rows.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Sugestões de busca"
          className="absolute top-13 right-0 left-0 z-50 flex flex-col rounded-2xl border border-border bg-surface p-2 text-text shadow-pop"
        >
          {rows.map((r, i) => {
            const Icon = r.kind === "hist" ? History : r.kind === "trend" ? TrendingUp : Search;
            return (
              <li key={`${r.kind}-${r.text}`} role="presentation">
                {i === 0 && r.kind === "hist" && (
                  <p className="px-3 pt-1 pb-2 text-xs font-bold text-text-subtle uppercase">
                    Buscas recentes
                  </p>
                )}
                {i === firstTrend && (
                  <p className="px-3 pt-2 pb-2 text-xs font-bold text-text-subtle uppercase">
                    Em alta perto de você
                  </p>
                )}
                <div className="flex items-center">
                  <button
                    type="button"
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(r.text)}
                    className={cn(
                      "flex min-h-11 flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left",
                      i === active ? "bg-surface-2" : "hover:bg-surface-2",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-text-subtle" aria-hidden />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-text">{r.text}</span>
                      {r.hint && <span className="truncate text-xs text-text-subtle">{r.hint}</span>}
                    </span>
                  </button>
                  {r.kind === "hist" && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => removeHist(r.text)}
                      aria-label={`Remover “${r.text}” do histórico`}
                      className="flex size-11 items-center justify-center rounded-full text-text-subtle hover:bg-surface-2"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
