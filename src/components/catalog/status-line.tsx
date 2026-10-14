import { cn } from "@/components/ui/cn";
import type { ProfileSummary } from "@/lib/api/catalog";

const TONE = {
  open: { dot: "bg-success", text: "text-success-text" },
  soon: { dot: "bg-accent-hover", text: "text-accent-text" },
  closed: { dot: "bg-danger", text: "text-danger-text" },
} as const;

/** "Aberto agora · fecha às 19h" / "Fecha em breve" / "Fechado": os três níveis, calculados pelo servidor. Sem horário cadastrado, diz isso (nunca supõe aberto ou fechado). */
export function StatusLine({ status }: { status: ProfileSummary["status"] }) {
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
