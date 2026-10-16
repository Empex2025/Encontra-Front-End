"use client";

import { useQuery } from "@tanstack/react-query";
import { Flag, ListChecks } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyNote, PageError } from "@/components/catalog/section-state";
import {
  CreateAccountNote,
  PublicMain,
  SharedItemCard,
  SharerBar,
  ShareAside,
} from "@/components/public/public-shell";
import { Chip } from "@/components/ui/chip";
import { ApiError } from "@/lib/api/client";
import { shareApi } from "@/lib/api/share";
import { formatTimeAgo } from "@/lib/format";
import { denunciarHref, routes } from "@/lib/routes";

/** Página pública de uma lista compartilhada: quem recebe o link vê os itens sem precisar de conta. */
const TYPE_FILTERS = [
  { id: "all", label: "Tudo" },
  { id: "product", label: "Produtos" },
  { id: "service", label: "Serviços" },
  { id: "place", label: "Lugares" },
] as const;

export function SharedListView({ token }: { token: string }) {
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]["id"]>("all");
  const q = useQuery({
    queryKey: ["shared-list", token],
    queryFn: () => shareApi.list(token),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  if (q.isPending) {
    return (
      <PublicMain>
        <div
          aria-busy="true"
          aria-label="Carregando"
          className="h-72 animate-pulse rounded-2xl bg-surface-2"
        />
      </PublicMain>
    );
  }
  if (q.isError) {
    return (
      <PublicMain>
        {q.error instanceof ApiError && q.error.status === 404 ? (
          <Gone />
        ) : (
          <PageError
            what="a lista"
            error={q.error}
            onRetry={() => q.refetch()}
            backHref={routes.explorar}
            backLabel="Buscar perto de você"
          />
        )}
      </PublicMain>
    );
  }
  const l = q.data;
  const when = formatTimeAgo(l.updatedAt);
  const shown = type === "all" ? l.items : l.items.filter((it) => it.type === type);
  const countOf = (t: string) =>
    t === "all" ? l.items.length : l.items.filter((it) => it.type === t).length;
  const count = `${l.items.length} ${l.items.length === 1 ? "item" : "itens"}`;
  return (
    <>
      {l.ownerFirstName && <SharerBar name={l.ownerFirstName} />}
      <PublicMain
        aside={
          <ShareAside
            title={l.name}
            description={`Lista com ${count}`}
            imageUrl={l.items.find((it) => it.imageUrl)?.imageUrl ?? null}
            path={`/listas/${encodeURIComponent(token)}`}
          />
        }
      >
        <article className="flex flex-col gap-5">
          <header className="flex flex-col gap-1.5 rounded-2xl bg-surface p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-text-muted">
              <ListChecks className="size-4" aria-hidden />
              Lista compartilhada{l.ownerFirstName ? ` por ${l.ownerFirstName}` : ""}
            </p>
            <h1 className="text-[28px] leading-9 font-extrabold text-text-strong">{l.name}</h1>
            <p className="text-sm text-text-2">
              {count}
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
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((it) => (
                <li key={`${it.type}-${it.id}`}>
                  <SharedItemCard item={it} />
                </li>
              ))}
            </ul>
          )}

          <CreateAccountNote>
            Crie sua conta grátis para salvar produtos e lugares nos favoritos, montar suas listas e ser
            avisado quando o preço baixar
          </CreateAccountNote>

          <p className="text-right text-[13px] font-semibold">
            <Link
              href={denunciarHref("lista", token)}
              className="inline-flex items-center gap-1 text-danger-text hover:underline"
            >
              <Flag className="size-3.5" aria-hidden /> Denunciar esta lista
            </Link>
          </p>
        </article>
      </PublicMain>
    </>
  );
}

function Gone() {
  return (
    <section className="flex flex-col items-center gap-3.5 rounded-2xl bg-surface px-8 py-14 text-center shadow-sm">
      <h1 className="text-[28px] leading-9 font-extrabold text-text-strong">
        Este link não está mais disponível
      </h1>
      <p className="text-[15px] leading-[22px] text-text-2">
        A lista pode ter deixado de ser compartilhada ou o endereço está incorreto.
      </p>
      <Link
        href={routes.explorar}
        className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-[15px] font-bold text-on-primary hover:bg-primary-hover"
      >
        Buscar perto de você
      </Link>
    </section>
  );
}
