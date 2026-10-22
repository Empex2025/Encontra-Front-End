"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Pencil,
  Ruler,
  Scale,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { OPEN_LOCATION_EVENT } from "@/components/layout/location-picker";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { MapPanel } from "@/components/ui/map-panel";
import { NeedLocation } from "@/components/ui/need-location";
import { useDismiss } from "@/components/ui/use-dismiss";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import { useUserLocation } from "@/hooks/use-user-location";
import { track } from "@/lib/analytics/track";
import { COMPARE_SORTS, type CompareSort, fetchCompareSearch } from "@/lib/api/comparison";
import { categoryById } from "@/lib/domain/categories";
import { MAX_COMPARE, MIN_COMPARE } from "@/lib/domain/comparison";
import { RADIUS_STEPS, type RadiusKm } from "@/lib/domain/radius";
import { formatMoney } from "@/lib/format";
import { routes } from "@/lib/routes";

import { CompareButton } from "./compare-button";
import { SelectableCard, TypeTag } from "./selectable-card";

const SORT_LABEL: Record<CompareSort, string> = {
  relevance: "Mais relevantes",
  distance: "Mais perto",
  price: "Menor preço",
  price_desc: "Maior preço",
  rating: "Melhor avaliação",
  reviews: "Mais avaliados",
};

const chip = (on: boolean, extra?: string) =>
  cn(
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold whitespace-nowrap transition-colors",
    on
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-text-2 hover:border-navy-300",
    extra,
  );

const toggleChip = (on: boolean) =>
  cn(
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold whitespace-nowrap transition-colors",
    on
      ? "border-primary bg-selected text-text-strong"
      : "border-border bg-surface text-text-strong hover:border-navy-300",
  );

/** Passo do "1 Pesquise · 2 Salve até 3 · 3 Compare": feito (verde), atual (azul) ou adiante (cinza). */
function Step({
  n,
  title,
  hint,
  state,
}: {
  n: number;
  title: string;
  hint: string;
  state: "done" | "current" | "next";
}) {
  return (
    <div className="flex items-center gap-2.5" aria-current={state === "current" ? "step" : undefined}>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
          state === "done" && "bg-success text-white",
          state === "current" && "bg-primary text-on-primary",
          state === "next" && "bg-surface-3 text-text-subtle",
        )}
      >
        {n}
      </span>
      <div className="flex flex-col">
        <span className="text-sm leading-5 font-bold text-text-strong">{title}</span>
        <span className="hidden text-xs leading-4 text-text-subtle sm:block">{hint}</span>
      </div>
    </div>
  );
}

/**
 * Tela Comparar › seleção (artboard CompararSelecao): pesquisa, bandeja "Sua comparação", filtros e cartões com
 * "+ Comparar" sobre a foto. O quadro lado a lado fica em `/comparar/quadro`.
 */
export function ComparisonPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const { list, remove } = useComparisonSelection();
  const { location, isLoading, save } = useUserLocation();

  const [editing, setEditing] = useState(!q);
  const [text, setText] = useState(q);
  const [sort, setSort] = useState<CompareSort>("relevance");
  const [view, setView] = useState<"list" | "map">("list");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [homeService, setHomeService] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const hasLocation = (location.lat !== null && location.lng !== null) || !!location.label;
  const query = useInfiniteQuery({
    queryKey: [
      "compare-picker",
      q,
      sort,
      hasDiscount,
      openNow,
      homeService,
      verifiedOnly,
      location.radiusKm,
      location.lat,
      location.lng,
      location.label,
    ],
    enabled: q.length >= 2 && !isLoading && hasLocation,
    queryFn: ({ pageParam }) =>
      fetchCompareSearch(
        {
          q,
          sort,
          radiusKm: location.radiusKm,
          lat: location.lat,
          lng: location.lng,
          where: location.label,
          hasDiscount,
          openNow,
          homeService,
          verifiedOnly,
        },
        pageParam,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });

  const first = query.data?.pages[0];
  // Lugares não entram na comparação (sem critérios comparáveis).
  const items = (query.data?.pages.flatMap((p) => p.items) ?? []).filter((i) => i.type !== "place");
  const searched = q.length >= 2;
  const loading = searched && hasLocation && query.isPending;
  const serviceSearch = items.length > 0 && items.every((i) => i.type === "service");

  const submit = (term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setEditing(false);
    router.replace(`${pathname}?q=${encodeURIComponent(t)}`, { scroll: false });
    track({ type: "SEARCH", props: { q: t, source: "comparar" } });
  };

  const saved = list.length;
  const canCompare = saved >= MIN_COMPARE;
  const steps: ["done" | "current" | "next", "done" | "current" | "next", "done" | "current" | "next"] =
    canCompare
      ? ["done", "done", "current"]
      : searched
        ? ["done", "current", "next"]
        : ["current", "next", "next"];
  const where = location.label || "Local não definido";

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
      <Link
        href={routes.home}
        className="inline-flex h-11 items-center gap-1 self-start text-sm font-semibold text-link hover:underline lg:h-5"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para o início
      </Link>

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end lg:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] leading-9 font-bold text-text-strong lg:text-[32px] lg:leading-10">
            Comparar
          </h1>
          <p className="text-base leading-6 text-text-muted">
            Pesquise produtos ou serviços, salve até {MAX_COMPARE} opções da mesma categoria e compare lado a
            lado.
          </p>
        </div>
        <ol aria-label="Passos" className="flex min-w-0 items-center gap-2 sm:gap-3 lg:min-w-[540px]">
          <li>
            <Step n={1} title="Pesquise" hint="produto ou serviço" state={steps[0]} />
          </li>
          <li aria-hidden className="h-0.5 min-w-5 flex-1 bg-border" />
          <li>
            <Step n={2} title={`Salve até ${MAX_COMPARE}`} hint="da mesma categoria" state={steps[1]} />
          </li>
          <li aria-hidden className="h-0.5 min-w-5 flex-1 bg-border" />
          <li>
            <Step n={3} title="Compare" hint="e decida" state={steps[2]} />
          </li>
        </ol>
      </div>

      <div className="sticky top-16 z-[9] flex flex-wrap items-center gap-4 bg-bg py-3 lg:top-[84px]">
        {editing ? (
          <SearchForm
            initial={text}
            where={where}
            onChange={setText}
            onSubmit={submit}
            onCancel={q ? () => setEditing(false) : undefined}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setText(q);
              setEditing(true);
            }}
            aria-label="Editar busca"
            className="pillsearch flex h-16 min-w-0 flex-1 basis-full items-center gap-3 rounded-full border border-border bg-surface pr-2 pl-5 text-left shadow-raised hover:shadow-pop sm:basis-0 lg:min-w-[420px]"
          >
            <Search className="size-5 shrink-0 text-link" aria-hidden />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] leading-[22px] font-bold text-text-strong">{q}</span>
              <span className="truncate text-xs leading-4 text-text-muted">
                {where} · Até {location.radiusKm} km
              </span>
            </span>
            <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-4 text-[13px] font-bold text-text-strong">
              <Pencil className="size-3.5" aria-hidden />
              Nova busca
            </span>
          </button>
        )}

        <Tray
          saved={list}
          onRemove={remove}
          canCompare={canCompare}
          categoryLabel={list[0]?.group.label ?? "Qualquer categoria"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-surface px-4 py-3 shadow-card">
        <div role="group" aria-label="Ordenar" className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-bold text-text-strong">Ordenar:</span>
          {COMPARE_SORTS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={sort === s}
              onClick={() => setSort(s)}
              className={chip(sort === s)}
            >
              {SORT_LABEL[s]}
            </button>
          ))}
        </div>
        <span aria-hidden className="hidden h-6 w-px bg-surface-3 sm:block" />
        <DistanceChip
          radiusKm={location.radiusKm as RadiusKm}
          where={where}
          pending={save.isPending}
          failed={save.isError}
          onPick={(km, done) => save.mutate({ ...location, radiusKm: km }, { onSuccess: done })}
        />
        <span aria-hidden className="hidden h-6 w-px bg-surface-3 sm:block" />
        <div role="group" aria-label="Filtros" className="flex flex-wrap items-center gap-1.5">
          {(serviceSearch
            ? ([
                ["Atende em domicílio", homeService, setHomeService],
                ["Só verificados", verifiedOnly, setVerifiedOnly],
              ] as const)
            : ([
                ["Com desconto", hasDiscount, setHasDiscount],
                ["Loja aberta agora", openNow, setOpenNow],
              ] as const)
          ).map(([label, on, set]) => (
            <button
              key={label}
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => set(!on)}
              className={toggleChip(on)}
            >
              {on && <span aria-hidden>✓</span>}
              {label}
            </button>
          ))}
        </div>
        <div
          role="tablist"
          aria-label="Modo de visualização"
          className="flex rounded-full bg-surface-2 p-1 sm:ml-auto"
        >
          {(
            [
              ["list", "Lista", LayoutGrid],
              ["map", "Mapa", MapIcon],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={cn(
                "inline-flex h-[34px] items-center gap-1.5 rounded-full px-4 text-[13px] font-bold",
                view === id ? "bg-surface text-text-strong shadow-card" : "text-text-muted",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline sm:gap-4">
        <h2 className="text-xl leading-7 font-bold text-text-strong">
          {searched && first
            ? `${first.total} ${first.total === 1 ? "opção" : "opções"} para “${q}” · até ${location.radiusKm} km de ${where}`
            : searched
              ? `Opções para “${q}”`
              : "Opções para comparar"}
        </h2>
        <span className="text-sm leading-5 text-text-muted">
          Clique em <b className="text-text-strong">+ Comparar</b> na foto para salvar · até {MAX_COMPARE}, da
          mesma categoria
        </span>
      </div>

      <div className="-mt-2 flex flex-wrap items-center gap-2">
        <span className="text-[13px] leading-5 font-semibold text-text-muted">Relacionados à sua busca:</span>
        {first && (first.related ?? []).length > 0 ? (
          (first.related ?? []).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => submit(term)}
              className="fchip inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-text-strong hover:border-navy-300"
            >
              <Search className="size-3" aria-hidden />
              {term}
            </button>
          ))
        ) : (
          <span className="text-xs text-text-subtle">
            {first ? "Sem sugestões para esta busca" : "Aparecem depois da busca"}
          </span>
        )}
      </div>

      {view === "map" ? (
        <MapPanel
          total={first ? items.length : null}
          withCoords={first ? items.filter((i) => i.lat !== null).length : null}
        />
      ) : !hasLocation && !isLoading ? (
        <NeedLocation />
      ) : !searched ? (
        <EmptyBox
          title="Pesquise o que você quer comparar"
          hint="Digite um produto ou serviço no campo acima. Os resultados aparecem aqui e você salva até 3 da mesma categoria na bandeja “Sua comparação”."
        />
      ) : loading ? (
        <div
          className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-busy="true"
          aria-label="Carregando resultados"
        >
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} aria-hidden className="h-[330px] animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          title="Não foi possível buscar para comparar"
          onRetry={() => query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyBox
          title={`Nada comparável encontrado para “${q}”`}
          hint="Tente outro termo, tire os filtros ou amplie a distância."
        />
      ) : (
        <ul className="grid grid-cols-1 items-start gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const inList = list.some((e) => e.ref === `${item.type}:${item.id}`);
            return (
              <li key={item.id} className="min-w-0">
                <SelectableCard
                  item={item}
                  imageHeight={150}
                  highlight={inList}
                  topLeft={<CompareButton item={item} variant="overlay" />}
                  topRight={<TypeTag type={item.type} />}
                />
              </li>
            );
          })}
        </ul>
      )}
      {view === "list" && searched && query.hasNextPage && (
        <button
          type="button"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
          className="h-11 self-center rounded-lg border border-border-strong px-5 text-sm font-bold text-text-strong hover:bg-surface-2"
        >
          {query.isFetchingNextPage ? "Carregando…" : "Ver mais opções"}
        </button>
      )}
    </div>
  );
}

function EmptyBox({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-4 py-12 text-center shadow-card">
      <Scale className="size-8 text-text-subtle" aria-hidden />
      <p className="text-base font-bold text-text-strong">{title}</p>
      <p className="max-w-lg text-sm leading-[21px] text-text-muted">{hint}</p>
    </div>
  );
}

/** Formulário de busca aberto (artboard: "O que você procura" + "Onde"). O local é o do cabeçalho. */
function SearchForm({
  initial,
  where,
  onChange,
  onSubmit,
  onCancel,
}: {
  initial: string;
  where: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(initial);
      }}
      className="fade flex min-h-[72px] flex-1 basis-full flex-wrap items-center gap-x-4 gap-y-2 rounded-[36px] border-2 border-primary bg-surface py-2 pr-2 pl-6 shadow-pop md:flex-nowrap md:rounded-full md:py-0"
    >
      <Search className="size-5 shrink-0 text-link" aria-hidden />
      <div className="flex min-w-0 flex-[1.4] basis-48 flex-col">
        <label htmlFor="cq" className="text-[11px] leading-4 font-bold text-text-strong">
          O que você procura
        </label>
        <input
          id="cq"
          ref={ref}
          type="search"
          autoComplete="off"
          value={initial}
          onChange={(e) => onChange(e.target.value.slice(0, 80))}
          placeholder="Produto ou serviço. Ex.: tênis de corrida, cabeleireiro"
          className="min-w-0 bg-transparent text-base leading-6 text-text outline-none placeholder:text-text-subtle"
        />
      </div>
      <span aria-hidden className="hidden h-10 w-px bg-surface-3 md:block" />
      <MapPin className="hidden size-5 shrink-0 text-link md:block" aria-hidden />
      <div className="flex min-w-0 flex-1 basis-40 flex-col">
        <span className="text-[11px] leading-4 font-bold text-text-strong">Onde</span>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_LOCATION_EVENT))}
          className="truncate text-left text-base leading-6 text-text hover:underline"
          title="Alterar localização"
        >
          {where}
        </button>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-full px-3 text-sm font-semibold text-text-2 hover:bg-surface-2"
        >
          Cancelar
        </button>
      )}
      <button
        type="submit"
        disabled={initial.trim().length < 2}
        className="buscar ml-auto inline-flex h-14 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-extrabold text-on-accent hover:bg-accent-hover disabled:opacity-50"
      >
        <Search className="size-[18px]" aria-hidden />
        Buscar
      </button>
    </form>
  );
}

/** "Distância: Até 5 km ▾": abre as opções de raio e grava a preferência da pessoa. */
function DistanceChip({
  radiusKm,
  where,
  pending,
  failed,
  onPick,
}: {
  radiusKm: RadiusKm;
  where: string;
  pending: boolean;
  failed: boolean;
  onPick: (km: RadiusKm, done: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tmp, setTmp] = useState<RadiusKm>(radiusKm);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setTmp(radiusKm);
          setOpen((o) => !o);
        }}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-primary bg-selected px-3.5 text-[13px] font-bold whitespace-nowrap text-text-strong"
      >
        <Ruler className="size-4" aria-hidden />
        Distância: Até {radiusKm} km
        <ChevronDown className="size-3" aria-hidden />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Distância"
          className="absolute top-full left-0 z-40 mt-2 w-[min(92vw,340px)] rounded-2xl border border-border bg-surface p-5 shadow-pop"
        >
          <h3 className="text-base font-bold text-text-strong">Até onde você quer ir?</h3>
          <p className="mt-1 text-sm text-text-muted">
            A partir de <b className="text-text">{where}</b>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {RADIUS_STEPS.map((km) => (
              <button
                key={km}
                type="button"
                aria-pressed={tmp === km}
                onClick={() => setTmp(km)}
                className={cn(
                  "h-10 min-w-14 rounded-full border px-3 text-sm font-bold",
                  tmp === km
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border text-text-2 hover:border-navy-300",
                )}
              >
                {km} km
              </button>
            ))}
          </div>
          {failed && (
            <p role="alert" className="mt-3 text-sm text-danger-text">
              Não foi possível salvar. Tente de novo.
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="h-11 rounded-lg px-4 text-sm font-semibold text-text-2 hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onPick(tmp, close)}
              className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              Mostrar resultados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Bandeja "Sua comparação": 3 vagas, contagem, categoria e o botão para ir ao quadro. */
function Tray({
  saved,
  onRemove,
  canCompare,
  categoryLabel,
}: {
  saved: ReturnType<typeof useComparisonSelection>["list"];
  onRemove: (ref: string) => void;
  canCompare: boolean;
  categoryLabel: string;
}) {
  const n = saved.length;
  return (
    <section
      aria-label="Sua comparação"
      className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl bg-primary py-2 pr-2 pl-4 shadow-raised"
    >
      <div className="flex min-w-32 flex-col">
        <span className="inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-bold text-white">
          <Scale className="size-4 text-amber" aria-hidden />
          Sua comparação
        </span>
        <span className="text-xs leading-4 font-bold text-amber">
          {n === 0 ? "Nenhuma opção salva" : n === 1 ? "1 de 3 salva" : `${n} de 3 salvas`}
        </span>
        <span className="text-[11px] leading-4 text-navy-200">{categoryLabel}</span>
      </div>
      {Array.from({ length: MAX_COMPARE }, (_, i) => {
        const e = saved[i];
        const cat = e?.categoryId ? categoryById(e.categoryId) : undefined;
        const name = e?.title ?? e?.group.label ?? "";
        return (
          <div
            key={i}
            title={name || undefined}
            className={cn(
              "flex h-12 w-[150px] items-center gap-2 rounded-[10px] px-1.5",
              e
                ? "border-[1.5px] border-solid border-white/25 bg-white/10"
                : "border-[1.5px] border-dashed border-navy-300",
            )}
          >
            {e ? (
              <>
                <span
                  className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-700 text-[11px] font-extrabold text-white"
                  style={cat ? { background: cat.colorVar } : undefined}
                >
                  {name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join("")}
                  {e.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
                    <img src={e.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs leading-4 font-bold text-white">{name}</span>
                  {typeof e.priceCents === "number" && (
                    <span className="truncate text-[11px] leading-[14px] text-navy-200">
                      {formatMoney(e.priceCents)}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(e.ref)}
                  aria-label={`Remover ${name} da comparação`}
                  className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </>
            ) : (
              <span className="flex-1 text-center text-xs font-semibold text-navy-300">+ vaga livre</span>
            )}
          </div>
        );
      })}
      {canCompare ? (
        <Link
          href={routes.compararQuadro}
          className="cmpgo inline-flex h-12 items-center gap-2 rounded-[10px] bg-accent px-[18px] text-sm font-extrabold whitespace-nowrap text-on-accent hover:bg-amber-400"
        >
          Comparar opções →
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex h-12 items-center rounded-[10px] bg-white/10 px-3.5 text-center text-xs leading-4 font-bold text-navy-200"
        >
          Salve {MIN_COMPARE} opções
          <br />
          para comparar
        </span>
      )}
    </section>
  );
}
