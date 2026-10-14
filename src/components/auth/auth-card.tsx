import { Logo } from "@/components/layout/logo";
import { cn } from "@/components/ui/cn";

/** Moldura das telas de entrada: logo, título e cartão central (sem menu lateral). */
export function AuthCard({
  title,
  subtitle,
  step,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  /** "Etapa 1 de 4" */
  step?: { current: number; total: number; label?: string };
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn("mx-auto flex w-full flex-col gap-6", wide ? "max-w-xl" : "max-w-md")}>
      <div className="self-center rounded-2xl bg-header px-4 py-2">
        <Logo />
      </div>
      <section
        aria-labelledby="auth-title"
        className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8"
      >
        {step && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-text-subtle uppercase">
              Etapa {step.current} de {step.total}
              {step.label ? ` · ${step.label}` : ""}
            </p>
            <div
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={step.total}
              aria-valuenow={step.current}
              aria-label={`Etapa ${step.current} de ${step.total}`}
              className="flex gap-1.5"
            >
              {Array.from({ length: step.total }, (_, i) => (
                <span
                  key={i}
                  className={cn("h-1.5 flex-1 rounded-full", i < step.current ? "bg-accent" : "bg-surface-3")}
                />
              ))}
            </div>
          </div>
        )}
        <header className="flex flex-col gap-1">
          <h1 id="auth-title" className="text-2xl font-bold text-text-strong">
            {title}
          </h1>
          {subtitle && <p className="text-base text-text-muted">{subtitle}</p>}
        </header>
        {children}
      </section>
    </div>
  );
}

export function PrimaryButton({
  children,
  disabled,
  type = "submit",
  onClick,
  loading,
  looksDisabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
  loading?: boolean;
  /** Cinza, mas ainda clicável: o clique mostra os erros dos campos (regra "desabilitado até ficar válido"). */
  looksDisabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={looksDisabled || undefined}
      className={cn(
        "h-12 rounded-lg px-5 text-base font-bold transition-colors",
        disabled || loading || looksDisabled
          ? "bg-surface-3 text-text-subtle"
          : "bg-primary text-on-primary hover:bg-primary-hover",
        (disabled || loading) && "cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="h-12 rounded-lg border border-border-strong bg-surface px-5 text-base font-semibold text-text-2 hover:bg-surface-2"
    >
      {children}
    </button>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-danger-text">
      {children}
    </p>
  );
}
