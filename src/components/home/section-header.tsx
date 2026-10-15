import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Cabeçalho dos blocos da Home (protótipo): rótulo com ícone em caixa-alta, título de 24 px e subtítulo. */
export function SectionHeader({
  id,
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  aside,
}: {
  id: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Lado direito (contador e setas). */
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-xs leading-4 font-extrabold tracking-[0.6px] text-accent-text uppercase">
          <Icon className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
          {eyebrow}
        </span>
        <h2 id={id} className="text-2xl leading-8 font-bold text-text-strong">
          {title}
        </h2>
        {subtitle && <p className="text-sm leading-5 text-text-muted">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}
