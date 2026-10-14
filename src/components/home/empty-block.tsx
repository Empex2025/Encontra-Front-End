import type { ReactNode } from "react";

/** Cabeçalho de seção da Home com estado vazio: a estrutura fica visível mesmo sem dados reais. */
export function EmptyBlock({
  id,
  title,
  subtitle,
  message,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div>
        <h2 id={id} className="text-xl font-bold text-text-strong">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-6 text-sm text-text-muted">
        <p>{message}</p>
        {children}
      </div>
    </section>
  );
}
