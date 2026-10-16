import type { ReactNode } from "react";

export const sysBtnPrimary =
  "inline-flex h-11 items-center justify-center rounded-lg bg-navy px-5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60";
export const sysBtnOutline =
  "inline-flex h-11 items-center justify-center rounded-lg border border-navy bg-surface px-5 text-sm font-bold text-navy hover:bg-surface-2";

/** Cartão central das telas de sistema (Estados.dc.html): ícone 96 px, título 28/36, texto 15/22, botões 44 px. */
export function SystemCard({
  icon,
  tone,
  eyebrow,
  title,
  text,
  children,
  foot,
}: {
  icon: ReactNode;
  tone: "amber" | "danger" | "navy";
  eyebrow?: string;
  title: string;
  text: string;
  children?: ReactNode;
  foot?: ReactNode;
}) {
  const tile =
    tone === "amber"
      ? "bg-accent-soft text-accent"
      : tone === "danger"
        ? "bg-danger-soft text-danger-text"
        : "bg-selected text-link";
  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-3 rounded-2xl bg-surface px-4 py-12 text-center shadow-card sm:py-14">
      <span className={`flex size-24 items-center justify-center rounded-3xl ${tile}`}>{icon}</span>
      {eyebrow && <p className="text-xs font-bold tracking-[0.12em] text-accent-ink uppercase">{eyebrow}</p>}
      <h1 className="text-2xl font-bold text-navy sm:text-[28px] sm:leading-9">{title}</h1>
      <p className="max-w-[520px] text-[15px] leading-[22px] text-text-muted">{text}</p>
      {children}
      {foot}
    </section>
  );
}
