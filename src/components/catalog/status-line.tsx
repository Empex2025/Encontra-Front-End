import { cn } from "@/components/ui/cn";
import type { ProfileSummary } from "@/lib/api/catalog";

const TONE = {
  open: { dot: "bg-success", text: "text-success-text", chip: "border-success/40 bg-success-soft" },
  soon: { dot: "bg-accent-hover", text: "text-accent-text", chip: "border-accent-border bg-accent-soft" },
  closed: { dot: "bg-danger", text: "text-danger-text", chip: "border-danger/30 bg-danger-soft" },
} as const;

/**
 * "Aberto agora · fecha às 19h" / "Fecha em breve" / "Fechado": os três níveis, calculados pelo servidor.
 * Sem horário cadastrado, diz isso (nunca supõe aberto ou fechado).
 * `chip`: selo de 22 px com borda (tela do produto e cards).
 */
export function StatusLine({
  status,
  variant = "line",
}: {
  status: ProfileSummary["status"];
  variant?: "line" | "chip";
}) {
  if (variant === "chip") {
    const t = status ? TONE[status.state] : null;
    return (
      <span
        className={cn(
          "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded border px-2 text-[11px] leading-4 font-bold whitespace-nowrap",
          t ? `${t.chip} ${t.text}` : "border-border bg-bg text-text-muted",
        )}
      >
        <span className={cn("size-1.5 rounded-full", t ? t.dot : "bg-border-strong")} aria-hidden />
        {status ? status.text : "Horário não informado"}
      </span>
    );
  }
  if (!status)
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted">
        <span className="size-2 rounded-full bg-border-strong" aria-hidden />
        Horário de funcionamento não informado
      </span>
    );
  const t = TONE[status.state];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", t.text)}>
      <span className={cn("size-2 rounded-full", t.dot)} aria-hidden />
      {status.text}
    </span>
  );
}
