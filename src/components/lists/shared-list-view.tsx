"use client";

import { useQuery } from "@tanstack/react-query";
import { Flag, ListChecks } from "lucide-react";
import Link from "next/link";

import { ResultCard } from "@/components/search/result-card";
import { ErrorState } from "@/components/ui/error-state";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api/client";
import { shareApi } from "@/lib/api/share";
import { denunciarHref, routes } from "@/lib/routes";
import { formatTimeAgo } from "@/lib/format";

/** Página pública de uma lista compartilhada: quem recebe o link vê os itens sem precisar de conta. */
export function SharedListView({ token }: { token: string }) {
  const { isGuest } = useSession();
  const q = useQuery({
    queryKey: ["shared-list", token],
    queryFn: () => shareApi.list(token),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  if (q.isPending) {
    return (
      <div
        aria-busy="true"
        aria-label="Carregando"
        className="mx-auto h-72 max-w-5xl animate-pulse rounded-2xl bg-surface-2"
      />
    );
  }
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <Gone />;
    return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  }
  const l = q.data;
  const when = formatTimeAgo(l.updatedAt);
  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-text-muted">
          <ListChecks className="size-4" aria-hidden />
          Lista compartilhada{l.ownerFirstName ? ` por ${l.ownerFirstName}` : ""}
        </p>
        <h1 className="text-2xl font-bold text-text-strong">{l.name}</h1>
        <p className="text-sm text-text-muted">
          {l.items.length} {l.items.length === 1 ? "item" : "itens"}
          {when ? ` · atualizada ${when}` : ""}
        </p>
      </header>

      {l.items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-text-muted">
          Esta lista ainda não tem itens.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {l.items.map((it) => (
            <li key={`${it.type}-${it.id}`}>
              <ResultCard item={it} />
            </li>
          ))}
        </ul>
      )}

      {isGuest && (
        <aside className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-bold text-text-strong">Crie sua conta grátis</h2>
          <p className="text-sm text-text-muted">
            Salve produtos e lugares nos favoritos, monte suas listas e receba aviso quando o preço baixar.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={routes.cadastro}
              className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-hover"
            >
              Criar conta grátis
            </Link>
            <Link
              href={routes.entrar}
              className="rounded-lg border border-border-strong px-5 py-3 text-sm font-bold text-text-strong hover:bg-selected"
            >
              Entrar
            </Link>
          </div>
        </aside>
      )}

      <footer className="flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
        <Link href="/institucional/termos" className="text-link hover:underline">
          Termos de uso
        </Link>
        <Link href="/institucional/privacidade" className="text-link hover:underline">
          Privacidade
        </Link>
        <Link
          href={denunciarHref("lista", token)}
          className="inline-flex items-center gap-1 text-link hover:underline"
        >
          <Flag className="size-3.5" aria-hidden /> Denunciar esta lista
        </Link>
      </footer>
    </article>
  );
}

function Gone() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-bold text-text-strong">Este link não está mais disponível</h1>
      <p className="text-text-muted">
        A lista pode ter deixado de ser compartilhada ou o endereço está incorreto.
      </p>
      <Link
        href={routes.explorar}
        className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-hover"
      >
        Buscar perto de você
      </Link>
    </section>
  );
}
