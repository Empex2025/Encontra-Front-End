"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { legal } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import { LEGAL_DOCS } from "@/lib/domain/legal-docs";
import { routes } from "@/lib/routes";

import { CookieControls } from "./cookie-controls";

export function LegalView({ doc }: { doc: string }) {
  const q = useQuery({
    queryKey: ["legal", doc],
    queryFn: () => legal.doc(doc),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  const notFound = q.error instanceof ApiError && q.error.status === 404;

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="Institucional" className="self-start rounded-2xl border border-border bg-surface p-2">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {LEGAL_DOCS.map((d) => (
            <li key={d.doc} className="shrink-0">
              <Link
                href={`${routes.institucional}/${d.doc}`}
                aria-current={d.doc === doc ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold whitespace-nowrap",
                  d.doc === doc ? "bg-selected text-text-strong" : "text-text-2 hover:bg-surface-2",
                )}
              >
                {d.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <article className="flex min-w-0 flex-col gap-5">
        {q.isPending ? (
          <p role="status" className="py-10 text-center text-text-muted">
            Carregando…
          </p>
        ) : notFound ? (
          <p className="py-10 text-center text-text-muted">Documento não encontrado.</p>
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (
          <>
            <header className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">
                {q.data.title}
              </h1>
              <p className="text-sm text-text-muted">
                Última atualização:{" "}
                {new Date(q.data.updatedAt).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {q.data.version ? ` · versão ${q.data.version}` : ""}
              </p>
            </header>
            {doc === "cookies" && <CookieControls />}
            {q.data.sections.map((s) => (
              <section key={s.heading} className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-text-strong">{s.heading}</h2>
                <p className="whitespace-pre-line text-text">{s.body}</p>
              </section>
            ))}
          </>
        )}
        <aside className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface-2 p-4">
          <p className="flex-1 font-semibold text-text-strong">Ainda tem dúvidas?</p>
          <Link
            href={routes.ajuda}
            className="inline-flex h-11 items-center rounded-lg border border-border-strong px-5 text-sm font-semibold text-text-2 hover:bg-surface"
          >
            Central de Ajuda
          </Link>
        </aside>
      </article>
    </div>
  );
}
