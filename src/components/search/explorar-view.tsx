"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  LayoutGrid,
  MapPin,
  RotateCw,
  Ruler,
  Search,
  SearchX,
  SlidersHorizontal,
  Tag,
  Target,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { OPEN_LOCATION_EVENT } from "@/components/layout/location-picker";
import { cn } from "@/components/ui/cn";
import { Chip } from "@/components/ui/chip";
import { useUserLocation } from "@/hooks/use-user-location";
import { track } from "@/lib/analytics/track";
import { ApiError } from "@/lib/api/client";
import {
  fetchSearch,
  type Kind,
  type Lens,
  type SearchItem,
  type SearchResponse,
  type Sort,
} from "@/lib/api/search";
import { CATEGORIES } from "@/lib/domain/categories";
import { RADIUS_STEPS } from "@/lib/domain/radius";
import {
  type ExplorarState,
  explorarHref,
  hasRefinements,
  MIN_RATING_FILTER,
  readExplorarState,
} from "@/lib/domain/search-state";
import { formatKm } from "@/lib/format";

import { DistanceButton } from "./distance-button";
import { ResultCard, ResultCardSkeleton } from "./result-card";
import { WantDialog } from "./want-dialog";

const LENS_LABEL: Record<Lens, string> = {
  live: "Ao vivo",
  offers: "Ofertas",
  price: "Menor preço",
  new: "Novidades",
  trending: "Em alta",
  open: "Aberto agora",
};
const LENS_SUFFIX: Record<Lens, string> = {
  live: " ao vivo",
  offers: " em oferta",
  price: " com preço",
  new: " novos",
  trending: " em alta",
  open: " abertos agora",
};
const KIND_LABEL: Record<Kind, string> = { product: "Produtos", service: "Serviços", place: "Lugares" };
const SORT_LABEL: Record<Sort, string> = {
  relevance: "Mais relevantes",
  distance: "Mais perto",
  price: "Menor preço",
  rating: "Melhor avaliação",
};

export function ExplorarView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const state = useMemo(() => readExplorarState(new URLSearchParams(params.toString())), [params]);
  const { location, isLoading: locLoading } = useUserLocation();

  // "Ampliar para N km" vale só para esta busca (não grava o raio do usuário).
  const [widened, setWidened] = useState<{ q: string; km: number } | null>(null);
  const radiusKm = widened && widened.q === state.q ? widened.km : location.radiusKm;
  const [wantOpen, setWantOpen] = useState(false);

  const isSearch = state.q.length > 0;
  const hasPlace = location.lat !== null || location.label.trim().length > 0;

  const setState = (next: Partial<ExplorarState>, eventProps?: Record<string, string>) => {
    router.replace(explorarHref({ ...state, ...next }), { scroll: false });
    if (eventProps && isSearch) track({ type: "FILTER_USED", props: { q: state.q, ...eventProps } });
  };

  const queryInput = {
    ...state,
    radiusKm,
    lat: location.lat,
    lng: location.lng,
    where: location.label,
  };

  const results = useInfiniteQuery({
    queryKey: ["search", queryInput],
    queryFn: ({ pageParam }) => fetchSearch(queryInput, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    enabled: !locLoading && hasPlace,
  });

  const first = results.data?.pages[0];
  const items = results.data?.pages.flatMap((p) => p.items) ?? [];

  // Evento de busca: uma vez por combinação de termo + filtros, quando a primeira página chega.
  const lastTracked = useRef("");
  useEffect(() => {
    if (!isSearch || !first) return;
    const key = JSON.stringify(queryInput);
    if (lastTracked.current === key) return;
    lastTracked.current = key;
    track({
      type: "SEARCH",
      props: {
        q: state.q,
        resultCount: first.total,
        radiusKm,
        cat: state.cat ?? null,
        lens: state.lens ?? null,
        sort: state.sort,
      },
    });
  });

  const title = (() => {
    const cat = state.cat ? CATEGORIES.find((c) => c.id === state.cat)?.name : undefined;
    if (!isSearch) {
      const base = cat ?? (state.lens ? LENS_LABEL[state.lens] : "O que tem perto de você");
      if (cat && state.lens) return `${cat} · ${LENS_LABEL[state.lens].toLowerCase()} perto de você`;
      return cat || state.lens ? `${base} perto de você` : base;
    }
    const n = first?.total ?? 0;
    return `${n} ${n === 1 ? "resultado" : "resultados"}${state.lens ? LENS_SUFFIX[state.lens] : ""} para “${state.q}”${cat ? ` em ${cat}` : ""}`;
  })();

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1
          className={cn(
            "font-bold text-text-strong",
            isSearch ? "text-2xl leading-8" : "text-[32px] leading-10",
          )}
        >
          Explorar
        </h1>
        {!isSearch && (
          <p className="text-base text-text-muted">
            Encontre o que você procura ou descubra o que está acontecendo perto de você.
          </p>
        )}
      </header>

      <SearchBar
        key={state.q}
        q={state.q}
        whereLabel={location.label}
        radiusKm={radiusKm}
        onSubmit={(q) => {
          setWidened(null);
          router.push(explorarHref({ q, specialty: [], sort: "relevance", cat: state.cat }));
        }}
      />

      <CategoryRow
        state={state}
        isSearch={isSearch}
        counts={first?.facets.categories}
        onPick={(cat) => setState({ cat }, { filter: "cat", value: cat ?? "tudo" })}
      />

      {isSearch && first && (
        <div className="flex flex-col gap-3">
          <div role="group" aria-label="Descobrir por" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <Chip label="Tudo" selected={!state.lens} onClick={() => setState({ lens: undefined })} />
            {(Object.keys(LENS_LABEL) as Lens[]).map((l) => (
              <Chip
                key={l}
                label={LENS_LABEL[l]}
                count={first.facets.lenses[l] ?? 0}
                selected={state.lens === l}
                leading={
                  l === "live" ? <span className="size-2 rounded-full bg-danger" aria-hidden /> : undefined
                }
                onClick={() =>
                  setState({ lens: state.lens === l ? undefined : l }, { filter: "lens", value: l })
                }
              />
            ))}
          </div>
          <FilterRow state={state} facets={first.facets} setState={setState} />
        </div>
      )}

      {!hasPlace && !locLoading ? (
        <NeedLocation />
      ) : (
        <section aria-labelledby="res-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <h2 id="res-title" className="text-xl leading-7 font-bold text-text-strong" aria-live="polite">
              {results.isPending ? (isSearch ? `Buscando “${state.q}”…` : "Carregando…") : title}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {isSearch && (
                <button
                  type="button"
                  onClick={() => setWantOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-accent-border bg-accent-soft px-3.5 text-[13px] font-bold whitespace-nowrap text-accent-text"
                >
                  <Tag className="size-4" aria-hidden />
                  Quero “{state.q.length > 22 ? `${state.q.slice(0, 21)}…` : state.q}” em promoção
                </button>
              )}
              {isSearch && first?.widen && (first.widen.gain > 0 || first.total < 4) && (
                <button
                  type="button"
                  onClick={() => setWidened({ q: state.q, km: first.widen!.nextRadiusKm })}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-dashed border-navy-300 px-3.5 text-[13px] font-bold text-link"
                >
                  <Target className="size-4" aria-hidden />
                  Ampliar para {first.widen.nextRadiusKm} km
                  {first.widen.gain > 0 && (
                    <span className="rounded-full bg-accent px-2 text-[11px] font-extrabold text-on-accent">
                      +{first.widen.gain}
                    </span>
                  )}
                </button>
              )}
              {isSearch && (
                <label className="inline-flex items-center gap-2 text-[13px] text-text-muted">
                  Ordenar
                  <select
                    value={state.sort}
                    onChange={(e) =>
                      setState({ sort: e.target.value as Sort }, { filter: "sort", value: e.target.value })
                    }
                    className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text"
                  >
                    {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                      <option key={s} value={s}>
                        {SORT_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <span
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface-3 px-3.5 text-[13px] font-bold text-text-strong"
                title="O mapa entra quando o serviço de mapas for definido"
              >
                <LayoutGrid className="size-4" aria-hidden />
                Grade
              </span>
            </div>
          </div>

          {results.isPending ? (
            <ResultGrid>
              {Array.from({ length: 8 }, (_, i) => (
                <ResultCardSkeleton key={i} />
              ))}
            </ResultGrid>
          ) : results.isError ? (
            <ErrorState error={results.error} onRetry={() => results.refetch()} />
          ) : items.length === 0 ? (
            isSearch ? (
              <NoResults
                q={state.q}
                radiusKm={radiusKm}
                refined={hasRefinements(state) || !!state.lens || !!state.cat}
                nearest={first?.nearestOutside ?? null}
                onWiden={(km) => setWidened({ q: state.q, km })}
                onClear={() =>
                  setState({
                    lens: undefined,
                    cat: undefined,
                    kind: undefined,
                    serviceMode: undefined,
                    specialty: [],
                    minRating: undefined,
                  })
                }
                onWant={() => setWantOpen(true)}
              />
            ) : (
              <EmptyDiscovery radiusKm={radiusKm} />
            )
          ) : (
            <>
              <ResultGrid>
                {items.map((item, i) => (
                  <ResultCard
                    key={item.id}
                    item={item}
                    onOpen={() =>
                      track({
                        type: "SEARCH_RESULT_CLICK",
                        targetType: targetTypeOf(item),
                        targetId: item.id,
                        props: { q: state.q || null, position: i + 1, sponsored: item.sponsored },
                      })
                    }
                  />
                ))}
                {results.isFetchingNextPage &&
                  Array.from({ length: 4 }, (_, i) => <ResultCardSkeleton key={`more-${i}`} />)}
              </ResultGrid>
              {results.hasNextPage && !results.isFetchingNextPage && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => results.fetchNextPage()}
                    className="h-12 rounded-lg border border-primary px-6 text-[15px] font-bold text-text-strong hover:bg-surface-2"
                  >
                    Carregar mais resultados ({(first?.total ?? 0) - items.length} restantes)
                  </button>
                </div>
              )}
              {results.isFetchNextPageError && (
                <p role="alert" className="text-center text-sm text-danger-text">
                  Não foi possível carregar mais. Tente de novo.
                </p>
              )}
            </>
          )}

          {isSearch && first && first.total < 3 && first.similar.length > 0 && (
            <section aria-labelledby="similar" className="flex flex-col gap-3 pt-4">
              <h2 id="similar" className="text-lg font-bold text-text-strong">
                Parecidos com o que você buscou
              </h2>
              <ResultGrid>
                {first.similar.slice(0, 4).map((item) => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </ResultGrid>
            </section>
          )}
        </section>
      )}

      {wantOpen && (
        <WantDialog
          initialTerm={state.q}
          radiusKm={radiusKm}
          returnTo={`${pathname}?${params.toString()}`}
          onClose={() => setWantOpen(false)}
        />
      )}
    </div>
  );
}

function targetTypeOf(item: SearchItem) {
  if (item.type === "product") return "PRODUCT" as const;
  if (item.type === "service") return "SERVICE" as const;
  return item.profile?.kind === "provider" ? ("PROVIDER" as const) : ("STORE" as const);
}

function ResultGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {children}
    </div>
  );
}

function SearchBar({
  q,
  whereLabel,
  radiusKm,
  onSubmit,
}: {
  q: string;
  whereLabel: string;
  radiusKm: number;
  onSubmit: (q: string) => void;
}) {
  const [editing, setEditing] = useState(!q);
  const [text, setText] = useState(q);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {editing ? (
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const t = text.trim();
            if (t) onSubmit(t);
          }}
          className="flex min-h-14 flex-1 basis-full items-center gap-3 rounded-full border-2 border-primary bg-surface py-1 pr-1.5 pl-5 shadow-raised sm:basis-auto"
        >
          <Search className="size-5 shrink-0 text-text-subtle" aria-hidden />
          <label className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] leading-4 font-bold text-text-strong">O que você procura</span>
            <input
              type="search"
              value={text}
              autoFocus={!!q}
              onChange={(e) => setText(e.target.value.slice(0, 80))}
              placeholder="Produto ou serviço. Ex.: tênis de corrida, cabeleireiro"
              className="min-w-0 bg-transparent text-base text-text outline-none placeholder:text-text-subtle focus-visible:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-on-accent hover:bg-accent-hover disabled:opacity-50"
          >
            <Search className="size-4" aria-hidden />
            <span className="hidden sm:inline">Buscar</span>
            <span className="sr-only sm:hidden">Buscar</span>
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Editar busca: ${q}`}
          className="flex h-[52px] max-w-[560px] min-w-0 flex-[0_1_560px] items-center gap-3 rounded-full border border-border bg-surface pr-1.5 pl-[18px] text-left shadow-card hover:shadow-raised"
        >
          <Search className="size-5 shrink-0 text-text-subtle" aria-hidden />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] leading-5 font-bold text-text-strong">{q}</span>
            <span className="truncate text-xs text-text-muted">
              {whereLabel || "Local não definido"} · Até {radiusKm} km
            </span>
          </span>
          <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-[13px] font-bold text-text-strong">
            Nova busca
          </span>
        </button>
      )}
      <DistanceButton radiusKm={radiusKm} compact={!editing} />
    </div>
  );
}

function CategoryRow({
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
  // Na busca: Tudo, a ativa e as que têm resultado (regra 9). Na descoberta: todas.
  const list =
    isSearch && counts ? CATEGORIES.filter((c) => c.id === state.cat || (counts[c.id] ?? 0) > 0) : CATEGORIES;
  return (
    <nav aria-label="Categorias" className="-mx-1 overflow-x-auto px-1">
      <ul className="flex gap-1">
        {[{ id: undefined, name: "Tudo", icon: LayoutGrid, colorVar: "var(--text-strong)" }, ...list].map(
          (c) => {
            const on = state.cat === c.id;
            const Icon = c.icon;
            return (
              <li key={c.id ?? "tudo"}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onPick(on ? undefined : c.id)}
                  className="flex w-[84px] flex-col items-center gap-1.5 rounded-xl px-1 pt-1 pb-0.5"
                >
                  <span
                    className={cn(
                      "flex size-[52px] items-center justify-center rounded-[18px]",
                      on ? "bg-primary text-amber shadow-raised" : "bg-surface-2",
                    )}
                    style={on ? undefined : { color: c.colorVar }}
                  >
                    <Icon className="size-[22px]" aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "min-h-8 text-center text-xs leading-4",
                      on ? "font-bold text-text-strong" : "text-text-muted",
                    )}
                  >
                    {c.name}
                  </span>
                  <span
                    aria-hidden
                    className={cn("h-[3px] rounded-full bg-accent transition-[width]", on ? "w-6" : "w-0")}
                  />
                </button>
              </li>
            );
          },
        )}
      </ul>
    </nav>
  );
}

type Facets = SearchResponse["facets"];

function FilterRow({
  state,
  facets,
  setState,
}: {
  state: ExplorarState;
  facets: Facets;
  setState: (n: Partial<ExplorarState>, e?: Record<string, string>) => void;
}) {
  const kinds = facets.kinds
    ? (Object.keys(KIND_LABEL) as Kind[]).filter((k) => (facets.kinds?.[k] ?? 0) > 0)
    : [];
  const local = facets.serviceMode?.local ?? 0;
  const home = facets.serviceMode?.home ?? 0;
  const specialties = (facets.specialties ?? []).filter((s) => s.count > 0);
  const good = facets.minRating?.[String(MIN_RATING_FILTER)] ?? 0;

  const groups: { label: string; chips: React.ReactNode }[] = [];
  if (kinds.length > 1)
    groups.push({
      label: "Tipo",
      chips: kinds.map((k) => (
        <Chip
          key={k}
          size="sm"
          label={KIND_LABEL[k]}
          count={facets.kinds?.[k]}
          selected={state.kind === k}
          onClick={() => setState({ kind: state.kind === k ? undefined : k }, { filter: "kind", value: k })}
        />
      )),
    });
  if (local > 0 && home > 0)
    groups.push({
      label: "Onde atende",
      chips: (
        [
          ["local", "No local", local],
          ["home", "Vai até você", home],
        ] as const
      ).map(([v, l, n]) => (
        <Chip
          key={v}
          size="sm"
          label={l}
          count={n}
          selected={state.serviceMode === v}
          onClick={() =>
            setState(
              { serviceMode: state.serviceMode === v ? undefined : v },
              { filter: "serviceMode", value: v },
            )
          }
        />
      )),
    });
  if (specialties.length > 1)
    groups.push({
      label: "Serviço",
      chips: specialties.map((s) => {
        const on = state.specialty.includes(s.id);
        return (
          <Chip
            key={s.id}
            size="sm"
            label={s.label}
            count={s.count}
            selected={on}
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
  if (good > 0)
    groups.push({
      label: "Avaliação",
      chips: (
        <Chip
          size="sm"
          label="Nota 4,8 ou mais"
          count={good}
          selected={!!state.minRating}
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
  const any = hasRefinements(state);

  return (
    <div
      role="group"
      aria-label="Filtros"
      className="flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-2xl border border-border bg-surface px-4 py-3"
    >
      <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-text-strong">
        <SlidersHorizontal className="size-4" aria-hidden />
        Filtrar
      </span>
      {groups.map((g) => (
        <div key={g.label} role="group" aria-label={g.label} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-xs font-bold text-text-muted">{g.label}</span>
          {g.chips}
        </div>
      ))}
      {any && (
        <button
          type="button"
          onClick={() =>
            setState({ kind: undefined, serviceMode: undefined, specialty: [], minRating: undefined })
          }
          className="h-9 px-2 text-[13px] font-bold text-link underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

function NeedLocation() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
        <MapPin className="size-6" aria-hidden />
      </span>
      <h2 className="text-xl font-bold text-text-strong">Onde você quer procurar?</h2>
      <p className="max-w-md text-text-muted">
        Precisamos de um bairro, cidade ou da sua localização para mostrar o que está perto e calcular as
        distâncias.
      </p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_LOCATION_EVENT))}
        className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover"
      >
        Definir local
      </button>
    </section>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const offline = error instanceof ApiError && error.status === 0;
  return (
    <section
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-center"
    >
      <h3 className="text-xl font-bold text-text-strong">
        {offline ? "Sem conexão com o servidor" : "Não foi possível carregar os resultados"}
      </h3>
      <p className="max-w-md text-text-muted">
        {offline
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

function NoResults({
  q,
  radiusKm,
  refined,
  nearest,
  onWiden,
  onClear,
  onWant,
}: {
  q: string;
  radiusKm: number;
  refined: boolean;
  nearest: { name: string; distanceKm: number; neighborhood: string | null } | null;
  onWiden: (km: number) => void;
  onClear: () => void;
  onWant: () => void;
}) {
  // Próximo degrau da escala que alcança o item mais perto fora do raio.
  const reach = nearest ? RADIUS_STEPS.find((s) => s >= nearest.distanceKm) : undefined;
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-start gap-3">
        <SearchX className="mt-1 size-6 shrink-0 text-text-subtle" aria-hidden />
        <div>
          <h3 className="text-xl font-extrabold text-text-strong">
            Ainda não tem “{q}” até {radiusKm} km
          </h3>
          <p className="text-sm text-text-muted">A busca nunca termina vazia. Escolha um caminho:</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {refined && (
          <PathCard
            icon={<SlidersHorizontal className="size-5" aria-hidden />}
            title="Tirar os filtros"
            onClick={onClear}
          >
            Os filtros escolhidos podem estar escondendo opções.
          </PathCard>
        )}
        {nearest && reach && (
          <PathCard
            icon={<Ruler className="size-5" aria-hidden />}
            title={`Ampliar para ${reach} km`}
            onClick={() => onWiden(reach)}
          >
            {nearest.name} fica a {formatKm(nearest.distanceKm)}
            {nearest.neighborhood ? `, em ${nearest.neighborhood}` : ""}.
          </PathCard>
        )}
        <PathCard icon={<Tag className="size-5" aria-hidden />} title="Quero em promoção" onClick={onWant}>
          Avisamos lojas e prestadores perto que você quer “{q}”. Quando alguém criar uma oferta, você é
          avisado.
        </PathCard>
      </div>
    </section>
  );
}

function PathCard({
  icon,
  title,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 rounded-xl border border-border p-4 text-left hover:border-navy-300 hover:bg-surface-2"
    >
      <span className="flex items-center gap-2 font-bold text-text-strong">
        <span className="text-link">{icon}</span>
        {title}
      </span>
      <span className="text-sm text-text-muted">{children}</span>
    </button>
  );
}

function EmptyDiscovery({ radiusKm }: { radiusKm: number }) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
      <h3 className="text-xl font-bold text-text-strong">Ainda não há nada cadastrado até {radiusKm} km</h3>
      <p className="max-w-md text-text-muted">
        Assim que lojas e prestadores perto de você entrarem na EncontraÊ, eles aparecem aqui. Tente um raio
        maior ou outro local.
      </p>
    </section>
  );
}
