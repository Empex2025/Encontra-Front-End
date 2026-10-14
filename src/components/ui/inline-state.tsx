"use client";

import { RotateCw } from "lucide-react";

import { cn } from "./cn";

/** Erro dentro de um painel/card: mensagem + "Tentar de novo". Nunca se confunde com "vazio". */
export function InlineError({
  message,
  onRetry,
  retrying,
  dark,
  className,
}: {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  /** Para fundo escuro (faixa azul-marinho, visualizador de stories). */
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm",
        dark ? "bg-white/10 text-white" : "border border-danger bg-danger-soft text-danger-text",
        className,
      )}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-lg border px-4 font-semibold disabled:opacity-60",
          dark ? "border-white/60 hover:bg-white/10" : "border-danger-text hover:bg-surface-2",
        )}
      >
        <RotateCw className="size-4" aria-hidden />
        {retrying ? "Tentando…" : "Tentar de novo"}
      </button>
    </div>
  );
}

/** Aviso neutro de integração pendente (serviço externo ainda não conectado). Não é selo de "em breve". */
export function IntegrationNotice({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role="note"
      className={cn(
        "rounded-lg border border-dashed border-border-strong bg-surface-2 px-3 py-2 text-xs text-text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Esqueleto de carregamento para listas. */
export function ListSkeleton({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div aria-busy="true" aria-label={label} role="status" className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-2" />
      ))}
    </div>
  );
}
