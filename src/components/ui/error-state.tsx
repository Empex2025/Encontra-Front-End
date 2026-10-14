"use client";

import { RotateCw } from "lucide-react";

import { ApiError } from "@/lib/api/client";

import { cn } from "./cn";

/** O servidor não respondeu ou a rota não existe: provavelmente a fonte de dados ainda não foi conectada. */
function maybeNotConnected(error: Error) {
  return error instanceof ApiError && (error.status === 0 || error.status === 404 || error.status >= 500);
}

/**
 * Erro de carregamento: mensagem + "Tentar de novo". `compact` serve para blocos menores dentro de uma página
 * (a seção continua com título e o erro não pode parecer "vazio").
 */
export function ErrorState({
  error,
  onRetry,
  title,
  compact,
}: {
  error: Error;
  onRetry: () => void;
  /** Troca o título padrão ("Não foi possível carregar os resultados"). */
  title?: string;
  compact?: boolean;
}) {
  const slow = error instanceof ApiError && error.code === "TIMEOUT";
  const offline = error instanceof ApiError && error.status === 0 && !slow;
  return (
    <section
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface text-center",
        compact ? "px-5 py-6" : "px-6 py-12",
      )}
    >
      <h3 className={cn("font-bold text-text-strong", compact ? "text-base" : "text-xl")}>
        {slow
          ? "Algo deu errado"
          : offline
            ? "Sem conexão com o servidor"
            : (title ?? "Não foi possível carregar os resultados")}
      </h3>
      <p className="max-w-md text-sm text-text-muted">
        {slow
          ? "Está demorando mais que o normal. Tente de novo."
          : offline
            ? "Verifique sua internet e tente de novo."
            : "Não é você, é a gente. Tente de novo em alguns segundos."}
      </p>
      {maybeNotConnected(error) && (
        <p className="max-w-md text-xs text-text-subtle">
          Se o erro continuar, a fonte de dados pode ainda não estar conectada.
        </p>
      )}
      {error instanceof ApiError && error.status >= 500 && (
        <p className="text-xs text-text-subtle">Código do erro: {error.status}</p>
      )}
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-primary px-5 text-sm font-bold text-text-strong hover:bg-surface-2"
      >
        <RotateCw className="size-4" aria-hidden />
        Tentar de novo
      </button>
    </section>
  );
}
