"use client";

import { RotateCw } from "lucide-react";

import { ApiError } from "@/lib/api/client";

export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const slow = error instanceof ApiError && error.code === "TIMEOUT";
  const offline = error instanceof ApiError && error.status === 0 && !slow;
  return (
    <section
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-center"
    >
      <h3 className="text-xl font-bold text-text-strong">
        {slow
          ? "Algo deu errado"
          : offline
            ? "Sem conexão com o servidor"
            : "Não foi possível carregar os resultados"}
      </h3>
      <p className="max-w-md text-text-muted">
        {slow
          ? "Está demorando mais que o normal. Tente de novo."
          : offline
            ? "Verifique sua internet e tente de novo."
            : "Não é você, é a gente. Tente de novo em alguns segundos."}
      </p>
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
