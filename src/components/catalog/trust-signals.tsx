import { BadgeCheck, CircleHelp, Info } from "lucide-react";

import { cn } from "@/components/ui/cn";
import type { Signal } from "@/lib/domain/trust";

/**
 * Painel "Sinais de confiança": cada indicador tem rótulo e valor; o que falta aparece como "Não informado".
 * Nunca fica vazio nem some.
 */
export function TrustSignals({
  id,
  title = "Sinais de confiança",
  description,
  signals,
}: {
  id: string;
  title?: string;
  description?: string;
  signals: Signal[];
}) {
  return (
    <section aria-labelledby={`${id}-t`} className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex flex-col gap-0.5">
        <h2 id={`${id}-t`} className="text-base font-bold text-text-strong">
          {title}
        </h2>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
      <dl className="grid gap-2 sm:grid-cols-2">
        {signals.map((s) => {
          const Icon = s.tone === "ok" ? BadgeCheck : s.tone === "unknown" ? CircleHelp : Info;
          return (
            <div key={s.label} className="flex items-start gap-2 rounded-lg bg-surface-2 p-3">
              <Icon
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  s.tone === "ok" ? "text-success-text" : "text-text-subtle",
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <dt className="text-xs font-bold text-text-subtle">{s.label}</dt>
                <dd
                  className={cn(
                    "text-sm font-semibold",
                    s.tone === "ok"
                      ? "text-success-text"
                      : s.tone === "unknown"
                        ? "text-text-muted"
                        : "text-text",
                  )}
                >
                  {s.value}
                </dd>
                {s.hint && <p className="text-xs text-text-muted">{s.hint}</p>}
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
