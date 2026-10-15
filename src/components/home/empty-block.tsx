import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SectionHeader } from "./section-header";

/** Bloco da Home sem dados (carregando, erro ou vazio): o cabeçalho continua no lugar, com a mensagem abaixo. */
export function EmptyBlock({
  id,
  eyebrow,
  icon,
  title,
  subtitle,
  message,
  children,
}: {
  id: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <SectionHeader id={id} eyebrow={eyebrow} icon={icon} title={title} subtitle={subtitle} />
      <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-6 text-sm text-text-muted">
        <p>{message}</p>
        {children}
      </div>
    </section>
  );
}
