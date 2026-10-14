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
  const label = LEGAL_DOCS.find((d) => d.doc === doc)?.label ?? "Institucional";

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
        {q.isPending || q.isError || notFound ? (
          <>
            <header className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">{label}</h1>
              <p className="text-sm text-text-muted">Última atualização: —</p>
            </header>
            {doc === "cookies" && <CookieControls />}
            {q.isPending ? (
              <p role="status" className="py-10 text-center text-text-muted">
                Carregando o texto…
              </p>
            ) : notFound ? (
              <section className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-10 text-center">
                <h2 className="text-lg font-bold text-text-strong">Texto ainda não publicado</h2>
                <p className="max-w-md text-text-muted">
                  O servidor ainda não tem a versão oficial deste documento. Não mostramos um texto provisório
                  para não passar informação errada.
                </p>
              </section>
            ) : (
              <ErrorState
                error={q.error as Error}
                onRetry={() => q.refetch()}
                title="Não foi possível carregar este documento"
                description="O texto oficial vem do nosso servidor e não está disponível agora. Não mostramos uma versão provisória para não passar informação errada."
              />
            )}
          </>
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
            {q.data.sections.length === 0 && (
              <p className="rounded-2xl border border-border bg-surface px-6 py-10 text-center text-text-muted">
                Este documento ainda não tem conteúdo publicado.
              </p>
            )}
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
