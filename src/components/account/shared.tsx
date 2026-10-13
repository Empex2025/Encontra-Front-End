import { cn } from "@/components/ui/cn";

export const btnPrimary =
  "inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60";
export const btnOutline =
  "inline-flex h-11 items-center justify-center rounded-lg border border-border-strong px-5 text-sm font-semibold text-text-2 hover:bg-surface-2 disabled:opacity-60";
export const btnDanger =
  "inline-flex h-11 items-center justify-center rounded-lg bg-danger px-5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60";

/** Bloco de uma aba da conta. */
export function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5", className)}
    >
      {title && <h2 className="text-lg font-bold text-text-strong">{title}</h2>}
      {children}
    </section>
  );
}

export function Loading({ children = "Carregando…" }: { children?: string }) {
  return (
    <p role="status" className="py-8 text-center text-text-muted">
      {children}
    </p>
  );
}

export function errMsg(e: unknown, fallback = "Não foi possível concluir. Tente de novo.") {
  return e instanceof Error && e.message ? e.message : fallback;
}
