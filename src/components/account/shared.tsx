import { useId } from "react";

import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";

export const btnPrimary =
  "inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:bg-text-subtle disabled:text-on-primary disabled:opacity-60";
export const btnOutline =
  "inline-flex h-11 items-center justify-center rounded-lg border border-border-strong px-5 text-sm font-semibold text-text-2 hover:bg-surface-2 disabled:opacity-60";
export const btnDanger =
  "inline-flex h-11 items-center justify-center rounded-lg bg-danger px-5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60";
/** Botões de linha do protótipo (Minha Conta): contorno azul, 38 px. */
export const btnLine =
  "inline-flex h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary bg-surface px-3.5 text-[13px] font-bold text-text-strong hover:bg-surface-2 disabled:opacity-50";
export const btnLineMuted =
  "inline-flex h-[38px] shrink-0 items-center justify-center rounded-lg border border-border bg-surface px-3.5 text-[13px] font-bold text-text-strong hover:bg-surface-2 disabled:opacity-50";
export const btnLineDanger =
  "inline-flex h-[38px] shrink-0 items-center justify-center rounded-lg border border-danger-text bg-surface px-3.5 text-[13px] font-bold text-danger-text hover:bg-danger-soft disabled:opacity-50";
export const btnSmallDanger =
  "inline-flex h-[34px] shrink-0 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-bold text-danger-text hover:bg-danger-soft disabled:opacity-50";
export const btnSoftDanger =
  "inline-flex h-[38px] shrink-0 items-center justify-center rounded-lg bg-danger-soft px-3.5 text-[13px] font-bold text-danger-text hover:opacity-90 disabled:opacity-50";

/** Bloco de uma aba da conta (protótipo: 24 px de respiro, 16 px de raio, sombra leve). */
export function Card({
  title,
  aside,
  children,
  className,
}: {
  title?: string;
  /** Texto ou link à direita do título (alinhado pela linha de base). */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-card sm:p-6", className)}>
      {title && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-xl leading-7 font-bold text-text-strong">{title}</h2>
          {aside && <span className="text-[13px] text-text-subtle">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Linha de configuração: título 15/600, apoio 13 px, controle à direita, filete em cima. */
export function SettingRow({
  title,
  hint,
  tone,
  first,
  children,
}: {
  title: string;
  hint?: React.ReactNode;
  tone?: "danger";
  /** Primeira linha de um bloco sem filete (ex.: Senha). */
  first?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2",
        first ? "py-0" : "border-t border-surface-2 py-3.5",
      )}
    >
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
        <span className={cn("text-[15px] font-semibold", tone === "danger" ? "text-danger-text" : "text-text")}>
          {title}
        </span>
        {hint && <span className="text-[13px] leading-[18px] text-text-subtle">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Pílula de escolha única do protótipo (Aparência, WhatsApp, nome nas avaliações). */
export function ChoicePill({
  on,
  onClick,
  children,
  radio,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  radio?: boolean;
}) {
  return (
    <button
      type="button"
      {...(radio ? { role: "radio", "aria-checked": on } : { "aria-pressed": on })}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap",
        on
          ? "border-primary bg-primary text-on-primary"
          : "border-border bg-surface text-text-2 hover:border-navy-300",
      )}
    >
      {children}
    </button>
  );
}

/** Campo do protótipo: rótulo 13/700, caixa de 44 px com texto de 15 px. */
export function Field({
  label,
  hint,
  error,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-bold text-text">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={cn(
          "h-11 w-full rounded-lg border bg-surface px-3.5 text-[15px] text-text outline-none placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-focus/40",
          error ? "border-danger-text" : "border-border",
        )}
        {...rest}
      />
      {(error || hint) && (
        <p id={`${id}-msg`} role={error ? "alert" : undefined} className={cn("text-xs", error ? "text-danger-text" : "text-text-subtle")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/** Caixa de valor só de leitura (celular, CPF). */
export const readonlyBox =
  "flex h-11 min-w-0 items-center rounded-lg border border-border bg-bg px-3.5 text-[15px] text-text";

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

/** Estado da consulta do perfil, repassado às abas que usam só parte dos dados (o resto continua funcionando). */
export type ProfileState = { pending: boolean; error: Error | null; retry: () => void };

/** Dentro de um bloco que precisa do perfil: carregando ou erro com "Tentar de novo". */
export function ProfileStatus({ state }: { state: ProfileState }) {
  if (state.error)
    return (
      <ErrorState
        error={state.error}
        onRetry={state.retry}
        title="Não foi possível carregar estas preferências"
        description="Elas vêm do nosso servidor e não chegaram agora. As demais seções desta aba continuam disponíveis."
      />
    );
  return <Loading />;
}
