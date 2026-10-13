"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, RotateCw, Scale, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/components/ui/cn";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import { useUserLocation } from "@/hooks/use-user-location";
import { ApiError } from "@/lib/api/client";
import { type Cell, type ComparedItem, fetchComparison } from "@/lib/api/comparison";
import {
  computeWinners,
  DIFFERS_ID,
  isEqualRow,
  MAX_COMPARE,
  MAX_PRIORITIES,
  MIN_COMPARE,
  orderCriteria,
  togglePriority,
} from "@/lib/domain/comparison";
import { lojaHref, prestadorHref, produtoHref, routes } from "@/lib/routes";

const itemHref = (it: ComparedItem) =>
  it.type === "product"
    ? produtoHref(it.slug)
    : it.profile
      ? it.profile.kind === "provider"
        ? prestadorHref(it.profile.slug)
        : lojaHref(it.profile.slug)
      : routes.explorar;

function CellValue({ cell, boolean }: { cell: Cell | undefined; boolean: boolean }) {
  if (!cell || cell.text === null) return <span className="text-sm text-text-subtle">Não informado</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "text-sm font-semibold",
          boolean ? (cell.value === true ? "text-success-text" : "text-text-subtle") : "text-text-strong",
        )}
      >
        {cell.text}
      </span>
      {cell.detail && <span className="text-xs text-text-muted">{cell.detail}</span>}
    </div>
  );
}

/** Quadro "Comparar lado a lado" (Documento de entrega › Fluxo 3 › CompararE1). */
export function ComparisonBoard() {
  const { list, remove, clear } = useComparisonSelection();
  const { location } = useUserLocation();
  const [priorities, setPriorities] = useState<string[]>([]);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [notice, setNotice] = useState("");

  const refs = list.map((e) => e.ref);
  const enough = refs.length >= MIN_COMPARE;
  const view = useQuery({
    queryKey: ["comparison", refs, location.lat, location.lng],
    queryFn: () => fetchComparison(refs, { lat: location.lat, lng: location.lng }),
    enabled: enough,
    retry: (n, e) => !(e instanceof ApiError && e.status === 422) && n < 2,
  });

  // Itens que deixaram de existir saem da lista.
  const missing = view.data?.missing;
  useEffect(() => {
    missing?.forEach((r) => remove(r));
  }, [missing, remove]);

  const data = view.data;
  const items = data?.items ?? [];
  const criteria = data?.criteria ?? [];
  const selectable = criteria.filter((c) => c.priority);
  const validPriorities = priorities.filter((id) => selectable.some((c) => c.id === id));
  const winners = computeWinners(criteria, items, validPriorities);
  const rows = orderCriteria(criteria, validPriorities).filter(
    (c) => !onlyDiff || c.id === DIFFERS_ID || !isEqualRow(c, items),
  );
  const originOf = (ref: string) => list.find((e) => e.ref === ref)?.origin;

  const back = (
    <Link
      href={routes.explorar}
      className="inline-flex h-11 items-center gap-2 text-sm font-semibold text-link hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Voltar à pesquisa
    </Link>
  );

  if (!enough || (data && items.length < MIN_COMPARE)) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
        <Scale className="size-8 text-text-subtle" aria-hidden />
        <h2 className="text-lg font-bold text-text-strong">A comparação precisa de pelo menos 2 opções.</h2>
        <p className="text-sm text-text-muted">
          Na pesquisa, toque em “Comparar” nos cartões. Você escolhe até {MAX_COMPARE} opções da mesma
          categoria e elas aparecem aqui lado a lado.
        </p>
        <div>{back}</div>
      </section>
    );
  }

  if (view.isPending) {
    return (
      <div role="status" className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-muted">
        Montando a comparação…
      </div>
    );
  }

  if (view.isError || !data) {
    const mixed = view.error instanceof ApiError && view.error.code === "COMPARISON_MIXED_GROUP";
    return (
      <section
        role="alert"
        className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-bold text-text-strong">
          {mixed ? "Essas opções não são da mesma categoria." : "Não foi possível montar a comparação."}
        </h2>
        <p className="text-sm text-text-muted">
          {view.error instanceof ApiError ? view.error.message : "Tente de novo em alguns segundos."}
        </p>
        <div className="flex flex-wrap gap-2">
          {mixed ? (
            <button
              type="button"
              onClick={clear}
              className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover"
            >
              Começar nova comparação
            </button>
          ) : (
            <button
              type="button"
              onClick={() => view.refetch()}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover"
            >
              <RotateCw className="size-4" aria-hidden />
              Tentar de novo
            </button>
          )}
          {back}
        </div>
      </section>
    );
  }

  const cols = `10rem repeat(${items.length + (items.length < MAX_COMPARE ? 1 : 0)}, minmax(12rem, 1fr))`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {back}
          <h2 className="text-xl font-bold text-text-strong">Comparar {data.group.label}</h2>
          <p className="text-sm text-text-muted">
            {items.length} opções salvas · categoria {data.group.label}
          </p>
        </div>
        <button
          type="button"
          aria-pressed={onlyDiff}
          onClick={() => setOnlyDiff((v) => !v)}
          className={cn(
            "h-11 rounded-full border px-4 text-sm font-semibold",
            onlyDiff
              ? "border-primary bg-primary text-on-primary"
              : "border-border bg-surface text-text-2 hover:border-navy-300",
          )}
        >
          Mostrar só o que é diferente
        </button>
      </div>

      {selectable.length > 0 && (
        <section
          aria-labelledby="prioridades"
          className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 id="prioridades" className="text-sm font-bold text-text-strong">
              O que é mais importante para você?
            </h3>
            {validPriorities.length > 0 && (
              <button
                type="button"
                onClick={() => setPriorities([])}
                className="h-9 px-2 text-sm font-semibold text-link hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectable.map((c) => {
              const idx = validPriorities.indexOf(c.id);
              const on = idx >= 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    const r = togglePriority(validPriorities, c.id);
                    setPriorities(r.list);
                    setNotice(r.limitReached ? `Escolha até ${MAX_PRIORITIES} prioridades.` : "");
                  }}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
                    on
                      ? "border-primary bg-primary text-on-primary"
                      : "border-border bg-surface text-text-2 hover:border-navy-300",
                  )}
                >
                  {on && (
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent">
                      {idx + 1}
                    </span>
                  )}
                  {c.label}
                </button>
              );
            })}
          </div>
          <p role="status" className="min-h-5 text-sm text-text-muted">
            {notice}
          </p>
        </section>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <div
          role="table"
          aria-label={`Comparação de ${data.group.label}`}
          className="grid min-w-max"
          style={{ gridTemplateColumns: cols }}
        >
          <div role="row" className="contents">
            <div role="columnheader" className="sticky left-0 z-10 border-b border-border bg-surface p-3">
              <span className="sr-only">Critério</span>
            </div>
            {items.map((it) => (
              <div
                key={it.ref}
                role="columnheader"
                className="flex flex-col gap-2 border-b border-l border-border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-text-subtle">
                    {originOf(it.ref) ? `Salvo da ${originOf(it.ref)}` : "Salvo"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      remove(it.ref);
                      setNotice(`${it.title} saiu da comparação.`);
                    }}
                    aria-label={`Tirar ${it.title} da comparação`}
                    className="-m-2 flex size-11 items-center justify-center rounded-full text-text-subtle hover:bg-surface-2"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
                {it.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
                  <img
                    src={it.imageUrl}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-lg object-cover"
                  />
                )}
                <p className="line-clamp-2 text-sm font-bold text-text-strong">{it.title}</p>
                {it.profile && <p className="truncate text-xs text-text-muted">{it.profile.name}</p>}
                <Link
                  href={itemHref(it)}
                  className="inline-flex h-10 items-center text-sm font-semibold text-link hover:underline"
                >
                  {it.type === "product" ? "Ver produto" : "Ver perfil"}
                </Link>
              </div>
            ))}
            {items.length < MAX_COMPARE && (
              <div
                role="columnheader"
                className="flex items-center justify-center border-b border-l border-border p-3"
              >
                <Link
                  href={routes.explorar}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-dashed border-border-strong px-4 text-sm font-semibold text-text-2 hover:border-navy-300"
                >
                  <Plus className="size-4" aria-hidden />
                  Adicionar opção
                </Link>
              </div>
            )}
          </div>

          {rows.map((c) => {
            const isPriority = validPriorities.includes(c.id);
            const win = winners[c.id] ?? [];
            return (
              <div key={c.id} role="row" className="contents">
                <div
                  role="rowheader"
                  className={cn(
                    "sticky left-0 z-10 border-b border-border p-3 text-sm font-semibold text-text-muted",
                    isPriority ? "bg-accent-soft" : "bg-surface",
                  )}
                >
                  {c.label}
                </div>
                {items.map((it) => {
                  const wins = win.includes(it.ref);
                  return (
                    <div
                      key={it.ref}
                      role="cell"
                      className={cn(
                        "flex flex-col gap-1 border-b border-l border-border p-3",
                        isPriority && "bg-accent-soft",
                      )}
                    >
                      {wins && c.priority && (
                        <span className="self-start rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-on-accent">
                          {c.priority.badge}
                        </span>
                      )}
                      <CellValue cell={it.cells[c.id]} boolean={c.kind === "boolean"} />
                    </div>
                  );
                })}
                {items.length < MAX_COMPARE && (
                  <div className="border-b border-l border-border" aria-hidden />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-text-muted">
        A EncontraÊ não escolhe por você: os destaques aparecem só no que você marcou como importante. Preços,
        horários e estoque são informados por cada loja ou prestador.
      </p>
    </div>
  );
}
