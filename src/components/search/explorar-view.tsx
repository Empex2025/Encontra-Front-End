"use client";

import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import {
  CircleCheck,
  MessageCircleQuestion,
  Ruler,
  SearchX,
  SlidersHorizontal,
  Tag,
  Target,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { NeedLocation } from "@/components/ui/need-location";
import { useSession } from "@/hooks/use-session";
import { useResumeAction } from "@/hooks/use-resume-action";
import { useUserLocation } from "@/hooks/use-user-location";
import { track } from "@/lib/analytics/track";
import { askStores, fetchSearch, type Sort } from "@/lib/api/search";
import { takePendingAction } from "@/lib/domain/auth-actions";
import { countWithCoords, resultsHeading } from "@/lib/domain/explorar-copy";
import { RADIUS_STEPS } from "@/lib/domain/radius";
import {
  type ExplorarState,
  explorarHref,
  hasRefinements,
  readExplorarState,
} from "@/lib/domain/search-state";
import { formatKm } from "@/lib/format";

import { ExplorarCard, ExplorarCardSkeleton, ExplorarRow } from "./explorar-card";
import { CategoryRow, FilterBox, LensRow } from "./explorar-filters";
import { ExplorarMap } from "./explorar-map";
import { ExplorarSearch } from "./explorar-search";
import { targetTypeOf } from "./result-card";
import { WantDialog } from "./want-dialog";

type View = "grid" | "mini" | "map";
const VIEWS: { id: View; label: string }[] = [
  { id: "grid", label: "Grade" },
  { id: "mini", label: "Grade + mapa" },
  { id: "map", label: "Mapa" },
];
const VIEW_KEY = "encontrae_exp_view";
const SORT_LABEL: Record<Sort, string> = {
  relevance: "Mais relevantes",
  distance: "Mais perto",
  price: "Menor preço",
  rating: "Melhor avaliação",
};

const MOSAIC = {
  grid: "columns-1 gap-5 min-[520px]:columns-2 min-[900px]:columns-3 min-[1180px]:columns-4 min-[1400px]:columns-5",
  mini: "columns-1 gap-5 min-[560px]:columns-2 xl:columns-3",
} as const;

function Mosaic({ mode, children }: { mode: keyof typeof MOSAIC; children: React.ReactNode }) {
  return <div className={cn(MOSAIC[mode], "*:mb-5 *:break-inside-avoid")}>{children}</div>;
}

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
  const { me } = useSession();
  // Quem pediu "Quero em promoção" sem conta volta aqui depois de entrar: reabre o pedido, sem enviar sozinho.
  useEffect(() => {
    if (me && takePendingAction("want")) queueMicrotask(() => setWantOpen(true));
  }, [me]);

  const isSearch = state.q.length > 0;
  const hasPlace = location.lat !== null || location.label.trim().length > 0;

  // Modo de exibição: a escolha da pessoa fica neste aparelho; sem escolha, descoberta em grade e busca em grade + mapa.
  const [pref, setPref] = useState<View | null>(null);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(VIEW_KEY);
      if (v === "grid" || v === "mini" || v === "map") queueMicrotask(() => setPref(v));
    } catch {}
  }, []);
  const view: View = pref ?? (isSearch ? "mini" : "grid");
  const pickView = (v: View) => {
    setPref(v);
    try {
      window.localStorage.setItem(VIEW_KEY, v);
    } catch {}
    track({ type: "FILTER_USED", props: { q: state.q || null, filter: "view", value: v } });
  };

  const setState = (next: Partial<ExplorarState>, eventProps?: Record<string, string>) => {
    router.replace(explorarHref({ ...state, ...next }), { scroll: false });
    if (eventProps && isSearch) track({ type: "FILTER_USED", props: { q: state.q, ...eventProps } });
  };

  const queryInput = { ...state, radiusKm, lat: location.lat, lng: location.lng, where: location.label };

  const results = useInfiniteQuery({
    queryKey: ["search", queryInput],
    queryFn: ({ pageParam }) => fetchSearch(queryInput, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    enabled: !locLoading && hasPlace,
  });

  const first = results.data?.pages[0];
  const items = results.data?.pages.flatMap((p) => p.items) ?? [];
  const remaining = (first?.total ?? 0) - items.length;

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

  const title = resultsHeading({
    q: state.q,
    cat: state.cat,
    lens: state.lens,
    status:
      !hasPlace && !locLoading
        ? "no-place"
        : results.isPending
          ? "loading"
          : results.isError
            ? "error"
            : "ready",
    total: first?.total ?? 0,
  });

  const ranked = state.sort === "price" || state.lens === "price";
  const open = (item: (typeof items)[number], i: number) => () =>
    track({
      type: "SEARCH_RESULT_CLICK",
      targetType: targetTypeOf(item),
      targetId: item.id,
      props: { q: state.q || null, position: i + 1, sponsored: item.sponsored },
    });

  const skeleton = (n: number) => Array.from({ length: n }, (_, i) => <ExplorarCardSkeleton key={i} />);

  const noMatch = !results.isPending && !results.isError && items.length === 0;
  const cards = (mode: keyof typeof MOSAIC) => (
    <>
      <Mosaic mode={mode}>
        {items.map((item, i) => (
          <ExplorarCard key={item.id} item={item} index={i} ranked={ranked} onOpen={open(item, i)} />
        ))}
      </Mosaic>
      {results.isFetchingNextPage && (
        <div
          role="status"
          aria-label="Carregando mais resultados"
          className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4"
        >
          {skeleton(4)}
        </div>
      )}
      {results.hasNextPage && !results.isFetchingNextPage && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => results.fetchNextPage()}
            className="h-12 rounded-lg border border-primary bg-surface px-6 text-[15px] font-bold text-text-strong hover:bg-surface-2"
          >
            Carregar mais resultados ({remaining} {remaining === 1 ? "restante" : "restantes"})
          </button>
        </div>
      )}
      {results.isFetchNextPageError && (
        <p role="alert" className="mt-4 text-center text-sm text-danger-text">
          Não foi possível carregar mais. Tente de novo.
        </p>
      )}
    </>
  );

  const rows = (
    <div className="flex max-h-[860px] flex-col gap-1 overflow-y-auto pr-1">
      {items.map((item, i) => (
        <ExplorarRow key={item.id} item={item} onOpen={open(item, i)} />
      ))}
      {results.hasNextPage && (
        <button
          type="button"
          disabled={results.isFetchingNextPage}
          onClick={() => results.fetchNextPage()}
          className="mt-2 h-12 shrink-0 rounded-lg border border-primary bg-surface px-6 text-[15px] font-bold text-text-strong hover:bg-surface-2 disabled:opacity-60"
        >
          {results.isFetchingNextPage
            ? "Carregando…"
            : `Carregar mais resultados (${remaining} ${remaining === 1 ? "restante" : "restantes"})`}
        </button>
      )}
    </div>
  );

  const map = (
    <ExplorarMap
      total={results.isSuccess ? items.length : null}
      withCoords={results.isSuccess ? countWithCoords(items) : null}
    />
  );

  let body: React.ReactNode;
  if (!hasPlace && !locLoading) body = <NeedLocation />;
  else if (results.isPending)
    body = (
      <div role="status" aria-label="Carregando resultados" className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {skeleton(8)}
      </div>
    );
  else if (results.isError) body = <ErrorState error={results.error} onRetry={() => results.refetch()} />;
  else if (noMatch)
    body = isSearch ? (
      <NoResults
        q={state.q}
        radiusKm={radiusKm}
        refined={hasRefinements(state) || !!state.lens || !!state.cat}
        nearest={first?.nearestOutside ?? null}
        place={{ lat: location.lat, lng: location.lng, where: location.label }}
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
    );
  else if (view === "grid") body = cards("grid");
  else if (view === "mini")
    body = (
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 min-w-0 lg:order-1">{cards("mini")}</div>
        <div className="order-1 lg:sticky lg:top-4 lg:order-2">{map}</div>
      </div>
    );
  else
    body = (
      <div className="grid items-start gap-4 lg:grid-cols-[440px_minmax(0,1fr)]">
        <div className="order-2 min-w-0 lg:order-1">{rows}</div>
        <div className="order-1 lg:order-2">{map}</div>
      </div>
    );

  const similar = isSearch && first && first.total < 3 ? first.similar.slice(0, 4) : [];

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
      <div className="flex flex-col gap-4">
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
            <p className="text-base leading-6 text-text-muted">
              Encontre o que você procura ou descubra o que está acontecendo perto de você.
            </p>
          )}
        </header>

        <ExplorarSearch
          key={state.q}
          q={state.q}
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

        {(isSearch || state.lens) && (
          <div className="flex flex-col gap-3">
            <LensRow
              lens={state.lens}
              counts={first?.facets.lenses}
              total={first?.total}
              ready={!!first}
              onPick={(l) => setState({ lens: l }, { filter: "lens", value: l ?? "tudo" })}
            />
            {isSearch && <FilterBox state={state} facets={first?.facets} setState={setState} />}
          </div>
        )}
      </div>

      <section aria-labelledby="res-title" className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-surface-3 pt-1 pb-5">
          <h2 id="res-title" className="mt-3 text-xl leading-7 font-bold text-text-strong" aria-live="polite">
            {title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {isSearch && (
              <button
                type="button"
                onClick={() => setWantOpen(true)}
                title="Avisamos as lojas perto que você quer isso em promoção"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-accent bg-accent-soft px-3.5 text-[13px] font-extrabold whitespace-nowrap text-accent-text"
              >
                <Tag className="size-[15px]" aria-hidden />
                Quero “{state.q.length > 22 ? `${state.q.slice(0, 21)}…` : state.q}” em promoção
              </button>
            )}
            {isSearch && first?.widen && (first.widen.gain > 0 || first.total < 4) && (
              <button
                type="button"
                onClick={() => setWidened({ q: state.q, km: first.widen!.nextRadiusKm })}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-dashed border-navy-300 bg-surface px-3.5 text-[13px] font-bold whitespace-nowrap text-link"
              >
                <Target className="size-4" aria-hidden />
                Ampliar para {first.widen.nextRadiusKm} km
                {first.widen.gain > 0 && (
                  <span className="rounded-full bg-accent px-2 py-px text-[11px] font-extrabold text-on-accent">
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
                  aria-label="Ordenar"
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
            <div
              role="group"
              aria-label="Como ver os resultados"
              className="inline-flex rounded-full bg-surface-3 p-[3px]"
            >
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={view === v.id}
                  onClick={() => pickView(v.id)}
                  className={cn(
                    "h-[34px] rounded-full px-3.5 text-[13px] font-bold whitespace-nowrap",
                    view === v.id ? "bg-surface text-text-strong shadow-card" : "text-text-muted",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {body}

        {similar.length > 0 && (
          <section aria-labelledby="similar" className="mt-6 flex flex-col gap-3">
            <h3 id="similar" className="text-[17px] leading-6 font-bold text-text-strong">
              Parecidos com o que você buscou
            </h3>
            <div className="grid grid-cols-2 items-start gap-5 lg:grid-cols-4">
              {similar.map((item, i) => (
                <ExplorarCard key={item.id} item={item} index={i} photo={190} />
              ))}
            </div>
          </section>
        )}
      </section>

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

/** Busca sem resultado: "A busca nunca termina vazia" com os caminhos do protótipo (ampliar, pedir em promoção, perguntar). */
function NoResults({
  q,
  radiusKm,
  refined,
  nearest,
  place,
  onWiden,
  onClear,
  onWant,
}: {
  q: string;
  radiusKm: number;
  refined: boolean;
  nearest: { name: string; distanceKm: number; neighborhood: string | null } | null;
  place: { lat: number | null; lng: number | null; where: string };
  onWiden: (km: number) => void;
  onClear: () => void;
  onWant: () => void;
}) {
  const requireAuth = useRequireAuth();
  const reach = nearest ? RADIUS_STEPS.find((s) => s >= nearest.distanceKm) : undefined;
  const ask = useMutation({ mutationFn: () => askStores({ term: q, radiusKm, ...place }) });
  const send = () => {
    if (ask.isPending || ask.isSuccess) return;
    if (!requireAuth("ask", q)) return;
    ask.mutate();
  };
  useResumeAction("ask", q, () => ask.mutate());

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-card">
      <div className="flex items-start gap-3">
        <SearchX className="mt-1 size-6 shrink-0 text-text-subtle" aria-hidden />
        <div className="flex flex-col gap-1">
          <h3 className="text-xl leading-7 font-extrabold text-text-strong">
            Ainda não tem “{q}” até {radiusKm} km
          </h3>
          <p className="text-sm leading-5 text-text-muted">
            A busca nunca termina vazia. Escolha um caminho:
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {refined && (
          <PathCard
            icon={<SlidersHorizontal className="size-[22px]" aria-hidden />}
            iconCls="text-link"
            title="Tirar os filtros"
            onClick={onClear}
          >
            Os filtros escolhidos podem estar escondendo opções.
          </PathCard>
        )}
        {nearest && reach && (
          <PathCard
            icon={<Ruler className="size-[22px]" aria-hidden />}
            iconCls="text-link"
            title={`Ampliar para ${reach} km`}
            onClick={() => onWiden(reach)}
          >
            {nearest.name} fica a {formatKm(nearest.distanceKm)}
            {nearest.neighborhood ? `, em ${nearest.neighborhood}` : ""}.
          </PathCard>
        )}
        <PathCard
          icon={<Tag className="size-[22px]" aria-hidden />}
          iconCls="text-accent-hover"
          title="Quero em promoção"
          tone="accent"
          onClick={onWant}
        >
          Avisamos lojas e prestadores perto que você quer “{q}”. Quando alguém criar uma oferta, você é
          avisado.
        </PathCard>
        <PathCard
          icon={
            ask.isSuccess ? (
              <CircleCheck className="size-[22px]" aria-hidden />
            ) : (
              <MessageCircleQuestion className="size-[22px]" aria-hidden />
            )
          }
          iconCls="text-success"
          title={ask.isSuccess ? "Pergunta enviada" : "Perguntar às lojas perto"}
          tone={ask.isSuccess ? "success" : undefined}
          disabled={ask.isPending}
          onClick={send}
        >
          {ask.isSuccess
            ? `${ask.data.profilesNotified} ${ask.data.profilesNotified === 1 ? "loja ou prestador recebeu" : "lojas e prestadores receberam"}. As respostas chegam em Conversas.`
            : ask.isError
              ? "Não foi possível enviar agora. Toque para tentar de novo."
              : `Enviamos “alguém faz ${q}?” para lojas e prestadores do ramo até ${radiusKm} km.`}
        </PathCard>
      </div>
    </section>
  );
}

function PathCard({
  icon,
  iconCls,
  title,
  tone,
  disabled,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  iconCls: string;
  title: string;
  tone?: "accent" | "success";
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left hover:border-navy-300 disabled:opacity-60",
        tone === "accent"
          ? "border-accent-border bg-accent-soft"
          : tone === "success"
            ? "border-success/40 bg-success-soft"
            : "border-border bg-surface",
      )}
    >
      <span className={iconCls}>{icon}</span>
      <span className="text-[15px] font-extrabold text-text-strong">{title}</span>
      <span className="text-[13px] leading-[18px] text-text-muted">{children}</span>
    </button>
  );
}

function EmptyDiscovery({ radiusKm }: { radiusKm: number }) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-6 py-12 text-center shadow-card">
      <h3 className="text-xl font-bold text-text-strong">Ainda não há nada cadastrado até {radiusKm} km</h3>
      <p className="max-w-md text-text-muted">
        Assim que lojas e prestadores perto de você entrarem na EncontraÊ, eles aparecem aqui. Tente um raio
        maior ou outro local.
      </p>
    </section>
  );
}
