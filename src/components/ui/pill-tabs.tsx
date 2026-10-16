"use client";

import { useRef } from "react";

import { cn } from "./cn";

export type PillTab = { id: string; label: string; count?: number | string | null };

const tabId = (base: string, id: string) => `${base}-tab-${id}`;
const panelId = (base: string) => `${base}-panel`;

/**
 * Abas em pílula com contador (protótipo › Favoritos e Minha atividade). Acessível: setas ← → trocam,
 * Home/End vão às pontas. O miolo fica em `PillTabPanel` com o mesmo `idBase`.
 */
export function PillTabs({
  tabs,
  value,
  onChange,
  label,
  idBase,
  bordered,
  bold = true,
  className,
}: {
  tabs: PillTab[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  idBase: string;
  /** Linha fina embaixo (Favoritos). */
  bordered?: boolean;
  bold?: boolean;
  className?: string;
}) {
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
      className={cn(
        "flex flex-wrap items-center gap-2",
        bordered && "border-b border-surface-3 pb-3",
        className,
      )}
    >
      {tabs.map((t, i) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            id={tabId(idBase, t.id)}
            role="tab"
            type="button"
            aria-selected={on}
            aria-controls={panelId(idBase)}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm whitespace-nowrap",
              bold ? "font-bold" : "font-semibold",
              on
                ? "border-primary bg-primary text-on-primary"
                : "border-border bg-surface text-text-2 hover:border-navy-300",
            )}
          >
            <span>{t.label}</span>
            {t.count != null && (
              <span
                className={cn(
                  "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs",
                  on ? "bg-accent text-on-accent" : "bg-surface-2 text-text-muted",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function PillTabPanel({
  idBase,
  active,
  children,
  className,
}: {
  idBase: string;
  active: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="tabpanel" id={panelId(idBase)} aria-labelledby={tabId(idBase, active)} className={className}>
      {children}
    </div>
  );
}
