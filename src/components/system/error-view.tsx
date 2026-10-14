"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { routes } from "@/lib/routes";

/** 500 (Documento de entrega › Telas de sistema). O "ref." é o digest do erro: some se o Next não gerar um. */
export function ErrorView({ digest, onRetry }: { digest?: string; onRetry: () => void }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-danger-soft text-danger-text">
        <TriangleAlert className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">
        Algo deu errado do nosso lado
      </h1>
      <p className="text-text-muted">
        Não é você, é a gente. Tente de novo; se continuar, fale com o suporte.
      </p>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-bold text-on-primary hover:bg-primary-hover"
        >
          Tentar de novo
        </button>
        <Link
          href={`${routes.ajuda}?aba=contato`}
          className="inline-flex h-12 items-center justify-center rounded-lg border border-border-strong px-6 font-semibold text-text-2 hover:bg-surface-2"
        >
          Falar com o suporte
        </Link>
      </div>
      <p className="text-xs text-text-subtle">Código do erro: 500{digest ? ` · ref. ${digest}` : ""}</p>
    </section>
  );
}
