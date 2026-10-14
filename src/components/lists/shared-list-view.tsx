"use client";

import { useQuery } from "@tanstack/react-query";
import { Flag, ListChecks } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ResultCard } from "@/components/search/result-card";
import { EmptyNote, PageError } from "@/components/catalog/section-state";
import { Chip } from "@/components/ui/chip";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api/client";
import { shareApi } from "@/lib/api/share";
import { denunciarHref, routes } from "@/lib/routes";
import { formatTimeAgo } from "@/lib/format";

/** Página pública de uma lista compartilhada: quem recebe o link vê os itens sem precisar de conta. */
const TYPE_FILTERS = [
  { id: "all", label: "Tudo" },
  { id: "product", label: "Produtos" },
  { id: "service", label: "Serviços" },
  { id: "place", label: "Lugares" },
] as const;

export function SharedListView({ token }: { token: string }) {
  const { isGuest } = useSession();
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]["id"]>("all");
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
    return (
      <PageError
        what="a lista"
        error={q.error}
        onRetry={() => q.refetch()}
        backHref={routes.explorar}
        backLabel="Buscar perto de você"
      />
    );
  }
  const l = q.data;
  const when = formatTimeAgo(l.updatedAt);
  const shown = type === "all" ? l.items : l.items.filter((it) => it.type === type);
  const countOf = (t: string) =>
    t === "all" ? l.items.length : l.items.filter((it) => it.type === t).length;
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

      <div role="group" aria-label="Filtrar itens da lista" className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            count={countOf(f.id)}
            size="sm"
            selected={type === f.id}
            disabled={f.id !== "all" && countOf(f.id) === 0}
            onClick={() => setType(f.id)}
          />
        ))}
      </div>

      {l.items.length === 0 ? (
        <EmptyNote title="Esta lista ainda não tem itens.">
          Quem criou a lista ainda não adicionou produtos, serviços ou lugares. Volte mais tarde.
        </EmptyNote>
      ) : shown.length === 0 ? (
        <EmptyNote title="Nenhum item neste filtro.">Escolha “Tudo” para ver a lista completa.</EmptyNote>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((it) => (
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
