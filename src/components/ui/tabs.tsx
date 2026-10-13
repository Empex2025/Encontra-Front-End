"use client";

import { useId, useRef } from "react";

import { cn } from "./cn";

export type TabDef = { id: string; label: string; count?: number | null };

/** Abas acessíveis (setas ← → trocam, Home/End vão às pontas). O conteúdo é de quem usa: `panelId(id)` liga as duas. */
export function Tabs({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: TabDef[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKey = (e: React.KeyboardEvent, i: number) => {
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    if (n < 0) return;
    e.preventDefault();
    onChange(tabs[n].id);
    refs.current[tabs[n].id]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-1 overflow-x-auto border-b border-border", className)}>
      {tabs.map((t, i) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={on}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "-mb-px h-12 shrink-0 border-b-2 px-4 text-sm font-semibold whitespace-nowrap",
              on ? "border-primary text-text-strong" : "border-transparent text-text-muted hover:text-text",
            )}
          >
            {t.label}
            {t.count != null && <span className="ml-1.5 text-text-subtle">({t.count})</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Atributos do painel que acompanha `Tabs` (mesmo `useId` não é compartilhado: o painel usa role + aria-label). */
export function TabPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="tabpanel" aria-label={label} tabIndex={0} className="pt-5 outline-none">
      {children}
    </div>
  );
}
