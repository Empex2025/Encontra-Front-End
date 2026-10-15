"use client";

import { useId, useRef } from "react";

import { cn } from "@/components/ui/cn";

export type UnderlineTab = { id: string; label: string; count?: number | string | null };

/**
 * Abas com sublinhado (Documento de entrega › Produto: Descrição · Avaliações · Sobre a loja).
 * Setas ← → trocam, Home/End vão às pontas. O sublinhado da aba ativa é âmbar.
 */
export function UnderlineTabs({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: UnderlineTab[];
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
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex gap-8 overflow-x-auto border-b border-surface-3", className)}
    >
      {tabs.map((t, i) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-${t.id}`}
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "-mb-px h-12 shrink-0 border-b-[3px] text-base font-bold whitespace-nowrap transition-colors",
              on ? "border-accent text-text-strong" : "border-transparent text-text-subtle hover:text-text",
            )}
          >
            {t.label}
            {t.count != null && ` (${t.count})`}
          </button>
        );
      })}
    </div>
  );
}
