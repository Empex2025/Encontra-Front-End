"use client";

import { LayoutGrid, SlidersHorizontal } from "lucide-react";

import { cn } from "@/components/ui/cn";
import type { Kind, Lens, SearchResponse } from "@/lib/api/search";
import { CATEGORIES } from "@/lib/domain/categories";
import { LENS_LABEL } from "@/lib/domain/explorar-copy";
import { type ExplorarState, hasRefinements, MIN_RATING_FILTER } from "@/lib/domain/search-state";

type Facets = SearchResponse["facets"];
type SetState = (n: Partial<ExplorarState>, e?: Record<string, string>) => void;

/** "Seções" do protótipo: Tudo + as 12 categorias (CAT12), quadrados de 52 px com barra âmbar na ativa. */
export function CategoryRow({
  state,
  isSearch,
  counts,
  onPick,
}: {
  state: ExplorarState;
  isSearch: boolean;
  counts?: Record<string, number>;
  onPick: (cat: string | undefined) => void;
}) {
  // Na busca: Tudo, a ativa e as que têm resultado. Na descoberta: todas.
  const list =
    isSearch && counts ? CATEGORIES.filter((c) => c.id === state.cat || (counts[c.id] ?? 0) > 0) : CATEGORIES;
  return (
    <nav aria-label="Seções" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-x-1 lg:flex-wrap lg:gap-y-0.5">
        {[{ id: undefined, name: "Tudo", icon: LayoutGrid, colorVar: "var(--link)" }, ...list].map((c) => {
          const on = state.cat === c.id;
          const Icon = c.icon;
          const n = c.id ? counts?.[c.id] : undefined;
          return (
            <li key={c.id ?? "tudo"} className="shrink-0">
              <button
                type="button"
                aria-pressed={on}
                aria-label={n !== undefined ? `${c.name}, ${n} ${n === 1 ? "opção" : "opções"}` : c.name}
                onClick={() => onPick(on ? undefined : c.id)}
                className="group flex w-[92px] flex-col items-center gap-1.5 px-0.5 pt-1 pb-0.5"
              >
                <span
                  className={cn(
                    "flex size-[52px] items-center justify-center rounded-[18px] transition duration-150 group-hover:-translate-y-[3px]",
                    on ? "bg-primary text-amber shadow-raised" : "bg-surface-2",
                  )}
                  style={on ? undefined : { color: c.colorVar }}
                >
                  <Icon className="size-[22px]" strokeWidth={1.8} aria-hidden />
                </span>
                <span
                  className={cn(
                    "min-h-8 max-w-full text-center text-xs leading-4",
                    on ? "font-bold text-text-strong" : "font-semibold text-text-muted",
                  )}
                >
                  {c.name}
                </span>
                <span
                  aria-hidden
                  className={cn("h-[3px] rounded-full bg-accent transition-[width]", on ? "w-5" : "w-0")}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const countCls = (on: boolean, size: "md" | "sm") =>
  cn(
    "inline-flex items-center justify-center rounded-full font-bold",
    size === "md" ? "h-[22px] min-w-[22px] px-[7px] text-xs" : "h-5 min-w-5 px-1.5 text-[11px]",
    on ? "bg-accent text-on-accent" : "bg-surface-2 text-text-muted",
  );

/** "Descobrir por": Tudo, Ao vivo, Ofertas… com a contagem de cada lente (só aparece em busca). */
export function LensRow({
  lens,
  counts,
  total,
  ready,
  onPick,
}: {
  lens?: Lens;
  counts?: Record<string, number>;
  total?: number;
  ready: boolean;
  onPick: (l: Lens | undefined) => void;
}) {
  const chip = (on: boolean) =>
    cn(
      "flex h-10 items-center gap-2 rounded-full border px-4 text-sm leading-5 font-semibold whitespace-nowrap transition-colors disabled:opacity-50",
      on
        ? "border-primary bg-primary text-on-primary"
        : "border-border bg-surface text-text-2 hover:border-navy-300",
    );
  return (
    <div role="tablist" aria-label="Descobrir por" className="flex flex-wrap gap-2">
      <button
        type="button"
        role="tab"
        aria-selected={!lens}
        className={chip(!lens)}
        onClick={() => onPick(undefined)}
      >
        <span>Tudo</span>
        <span className={countCls(!lens, "md")}>{ready && !lens && total !== undefined ? total : "—"}</span>
      </button>
      {(Object.keys(LENS_LABEL) as Lens[]).map((l) => {
        const on = lens === l;
        const n = counts?.[l];
        return (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={on}
            disabled={!ready && !on}
            className={chip(on)}
            onClick={() => onPick(on ? undefined : l)}
          >
            {l === "live" && <span className="size-2 animate-pulse rounded-full bg-danger" aria-hidden />}
            <span>{LENS_LABEL[l]}</span>
            <span className={countCls(on, "md")}>{ready && n !== undefined ? n : "—"}</span>
          </button>
        );
      })}
    </div>
  );
}

const KIND_LABEL: Record<Kind, string> = { product: "Produtos", service: "Serviços", place: "Lugares" };

function FChip({ label, n, on, onClick }: { label: string; n: number; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3 text-[13px] leading-[18px] font-semibold whitespace-nowrap transition-colors",
        on
          ? "border-primary bg-primary text-on-primary"
          : "border-border bg-surface text-text-2 hover:border-navy-300",
      )}
    >
      <span>{label}</span>
      <span className={countCls(on, "sm")}>{n}</span>
    </button>
  );
}

/**
 * Caixa "Filtrar" do protótipo: só aparece em busca e só com os grupos que ajudam (mais de um tipo, serviços que
 * atendem em casa e no local, especialidades, nota). Contagens vêm do servidor (`facets`).
 */
export function FilterBox({
  state,
  facets,
  setState,
}: {
  state: ExplorarState;
  facets: Facets | undefined;
  setState: SetState;
}) {
  if (!facets) return null;
  const sum = (c?: Record<string, number>) => Object.values(c ?? {}).reduce((a, b) => a + b, 0);
  const kinds = (Object.keys(KIND_LABEL) as Kind[]).filter(
    (k) => (facets.kinds?.[k] ?? 0) > 0 || state.kind === k,
  );
  const local = facets.serviceMode?.local ?? 0;
  const home = facets.serviceMode?.home ?? 0;
  const specs = (facets.specialties ?? []).filter((s) => s.count > 0);
  const good = facets.minRating?.[String(MIN_RATING_FILTER)] ?? 0;
  const total = Object.values(facets.kinds ?? {}).reduce((a, b) => a + b, 0) || sum(facets.categories);

  const groups: { label: string; chips: React.ReactNode }[] = [];
  if (kinds.length > 1)
    groups.push({
      label: "Tipo",
      chips: kinds.map((k) => (
        <FChip
          key={k}
          label={KIND_LABEL[k]}
          n={facets.kinds?.[k] ?? 0}
          on={state.kind === k}
          onClick={() => setState({ kind: state.kind === k ? undefined : k }, { filter: "kind", value: k })}
        />
      )),
    });
  if ((local > 0 && home > 0) || state.serviceMode)
    groups.push({
      label: "Onde atende",
      chips: (
        [
          ["local", "No local", local],
          ["home", "Vai até você", home],
        ] as const
      ).map(([v, l, n]) => (
        <FChip
          key={v}
          label={l}
          n={n}
          on={state.serviceMode === v}
          onClick={() =>
            setState(
              { serviceMode: state.serviceMode === v ? undefined : v },
              { filter: "serviceMode", value: v },
            )
          }
        />
      )),
    });
  if (specs.length > 1 || state.specialty.length)
    groups.push({
      label: "Serviço",
      chips: specs.map((s) => {
        const on = state.specialty.includes(s.id);
        return (
          <FChip
            key={s.id}
            label={s.label}
            n={s.count}
            on={on}
            onClick={() =>
              setState(
                { specialty: on ? state.specialty.filter((x) => x !== s.id) : [...state.specialty, s.id] },
                { filter: "specialty", value: s.id },
              )
            }
          />
        );
      }),
    });
  if ((good > 0 && (total === 0 || good < total)) || state.minRating)
    groups.push({
      label: "Avaliação",
      chips: (
        <FChip
          label="Nota 4,8 ou mais"
          n={good}
          on={!!state.minRating}
          onClick={() =>
            setState(
              { minRating: state.minRating ? undefined : MIN_RATING_FILTER },
              { filter: "minRating", value: "4.8" },
            )
          }
        />
      ),
    });
  if (groups.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Filtros"
      className="flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-2xl border border-surface-3 bg-surface px-4 py-3"
    >
      <span className="inline-flex items-center gap-1.5 text-[13px] leading-5 font-extrabold text-text-strong">
        <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
        Filtrar
      </span>
      {groups.map((g) => (
        <div key={g.label} role="group" aria-label={g.label} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-xs leading-4 font-bold text-text-muted">{g.label}</span>
          {g.chips}
        </div>
      ))}
      {hasRefinements(state) && (
        <button
          type="button"
          onClick={() =>
            setState({ kind: undefined, serviceMode: undefined, specialty: [], minRating: undefined })
          }
          className="h-[34px] rounded-full px-3 text-[13px] font-bold text-link underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
