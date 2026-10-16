"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Bell, Navigation, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { CouponCard } from "@/components/catalog/coupon-card";
import { WantDialog } from "@/components/search/want-dialog";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { NeedLocation } from "@/components/ui/need-location";
import { useUserLocation } from "@/hooks/use-user-location";
import { useResumeAction } from "@/hooks/use-resume-action";
import { track } from "@/lib/analytics/track";
import { fetchOffers, type OfferSort } from "@/lib/api/catalog";
import { CATEGORIES, categoryById } from "@/lib/domain/categories";
import { RADIUS_STEPS } from "@/lib/domain/radius";
import { routes } from "@/lib/routes";

import { LowestPrices } from "./lowest-prices";
import { OfferCard } from "./offer-card";

/** Ordem do protótipo (Maior desconto é o padrão); "relevance" fica só para a API. */
const SORTS: { id: OfferSort; label: string }[] = [
  { id: "discount", label: "Maior desconto" },
  { id: "distance", label: "Mais perto" },
  { id: "price", label: "Menor preço" },
  { id: "ending", label: "Acaba hoje" },
];

const fchip = (on: boolean, extra?: string) =>
  cn(
    "inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold whitespace-nowrap transition-colors",
    on
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-text-2 hover:border-navy-300",
    extra,
  );

function SectionTitle({ id, title, hint }: { id: string; title: string; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 id={id} className="text-xl leading-7 font-bold text-text-strong">
        {title}
      </h2>
      {hint && <span className="text-[13px] text-text-muted">{hint}</span>}
    </div>
  );
}

/** Cartões cinza no lugar dos blocos enquanto carrega (nunca uma tela vazia). */
function TileSkeleton({ n, className, h }: { n: number; className: string; h: string }) {
  return (
    <div className={className} aria-busy="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} aria-hidden className={cn("animate-pulse rounded-2xl bg-surface-2", h)} />
      ))}
    </div>
  );
}

export function OffersView() {
  const { location, isLoading, save } = useUserLocation();
  const ready = !isLoading;
  const requireAuth = useRequireAuth();
  const pathname = usePathname();
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | undefined>();
  const [sort, setSort] = useState<OfferSort>("discount");
  const [openNow, setOpenNow] = useState(false);
  const [wantOpen, setWantOpen] = useState(false);
  const [wantTerm, setWantTerm] = useState("");
  const [alertTerm, setAlertTerm] = useState("");
  // Quem pediu "Quero em promoção" sem conta volta aqui depois de entrar: reabre o pedido, sem enviar sozinho.
  useResumeAction("want", "ofertas", () => setWantOpen(true));

  useEffect(() => {
    const t = setTimeout(() => setQ(term.trim()), 350);
    return () => clearTimeout(t);
  }, [term]);

  const hasLocation = (location.lat !== null && location.lng !== null) || !!location.label;
  const query = useInfiniteQuery({
    queryKey: [
      "offers",
      q,
      cat,
      sort,
      openNow,
      location.radiusKm,
      location.lat,
      location.lng,
      location.label,
    ],
    enabled: ready && hasLocation,
    queryFn: ({ pageParam }) =>
      fetchOffers({
        q,
        cat,
        sort,
        openNow,
        radiusKm: location.radiusKm,
        lat: location.lat,
        lng: location.lng,
        where: location.label,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });

  const noPlace = ready && !hasLocation;
  const loading = !ready || (hasLocation && query.isPending);
  const failed = query.isError;

  const first = query.data?.pages[0];
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const facetCats = new Set(
    Object.entries(first?.facets.categories ?? {})
      .filter(([, n]) => n > 0)
      .map(([id]) => id),
  );
  // Só as categorias com oferta no raio; sem resposta ainda, a barra mostra todas, apagadas.
  const catList = first ? CATEGORIES.filter((c) => facetCats.has(c.id) || c.id === cat) : CATEGORIES;
  const filtered = !!(q || cat || openNow);

  const openWant = (initial: string) => {
    if (!requireAuth("want", "ofertas")) return;
    setWantTerm(initial);
    setWantOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] leading-9 font-bold text-text-strong lg:text-[32px] lg:leading-10">
            Ofertas &amp; Promoções
          </h1>
          <p className="text-base leading-6 text-text-muted">
            Descontos, cupons e preços baixos das lojas e prestadores perto de você.
          </p>
        </div>
        <span className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-full bg-surface px-3.5 text-[13px] text-text-muted shadow-card sm:self-auto">
          <Navigation className="size-3.5 text-text-muted" aria-hidden />
          Perto de{" "}
          <b className="text-text-strong">{location.label || (ready ? "local não definido" : "…")}</b>
        </span>
      </header>

      <section aria-labelledby="cupons-t" className="flex flex-col gap-3">
        <SectionTitle
          id="cupons-t"
          title="Cupons do dia"
          hint="Guarde e mostre o código na loja ou no chat."
        />
        {noPlace ? (
          <EmptyLine>Defina seu local para ver os cupons perto de você.</EmptyLine>
        ) : loading ? (
          <TileSkeleton
            n={4}
            h="h-[200px]"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          />
        ) : failed ? (
          <ErrorState
            error={query.error}
            compact
            title="Não foi possível carregar os cupons"
            onRetry={() => query.refetch()}
          />
        ) : first && first.coupons.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {first.coupons.map((c) => (
              <li key={c.id} className="min-w-0">
                <CouponCard
                  coupon={c}
                  variant="tile"
                  store={{
                    name: c.profile.name,
                    slug: c.profile.slug,
                    avatarUrl: c.profile.avatarUrl,
                    distanceKm: c.distanceKm,
                    color: c.categoryId ? categoryById(c.categoryId)?.colorVar : undefined,
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyLine>
            Nenhum cupom disponível agora neste raio. Volte mais tarde ou amplie a distância.
          </EmptyLine>
        )}
      </section>

      <section aria-labelledby="menores-t" className="flex flex-col gap-3">
        <SectionTitle
          id="menores-t"
          title="Menores preços perto de você"
          hint="Preço informado pela loja, com a hora da atualização."
        />
        <LowestPrices
          prices={first?.lowestPrices ?? []}
          state={noPlace ? "no-place" : loading ? "loading" : failed ? "error" : "ready"}
          error={query.error}
          onRetry={() => query.refetch()}
        />
      </section>

      <section aria-labelledby="todas-t" className="flex flex-col gap-4">
        <SectionTitle
          id="todas-t"
          title="Todas as ofertas"
          hint={
            first
              ? `${first.total} ${first.total === 1 ? "oferta" : "ofertas"} até ${location.radiusKm} km`
              : loading
                ? "Carregando…"
                : "—"
          }
        />

        <div className="sticky top-16 z-[9] flex flex-col gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card lg:top-[84px]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                setQ(term.trim());
              }}
              className="flex h-[42px] w-full items-center gap-2 rounded-full border border-border bg-bg pr-2 pl-3.5 focus-within:border-border-strong focus-within:bg-surface sm:w-[340px]"
            >
              <Search className="size-[18px] shrink-0 text-text-subtle" aria-hidden />
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value.slice(0, 80))}
                placeholder="Buscar oferta: tênis, pizza, corte…"
                aria-label="Buscar oferta"
                className="h-[38px] min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm("")}
                  aria-label="Limpar busca"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-text-2"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              )}
            </form>
            <div role="group" aria-label="Categorias" className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                aria-pressed={!cat}
                onClick={() => setCat(undefined)}
                className={fchip(!cat)}
              >
                Todas
              </button>
              {catList.map((c) => {
                const on = cat === c.id;
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    disabled={!first && !on}
                    onClick={() => setCat(on ? undefined : c.id)}
                    className={fchip(on, "disabled:opacity-50")}
                  >
                    <Icon className="size-4" style={on ? undefined : { color: c.colorVar }} aria-hidden />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-surface-3 pt-3">
            <div role="group" aria-label="Distância" className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] font-bold text-text-strong">Distância:</span>
              {RADIUS_STEPS.map((km) => (
                <button
                  key={km}
                  type="button"
                  aria-pressed={location.radiusKm === km}
                  disabled={save.isPending || !hasLocation}
                  onClick={() => save.mutate({ ...location, radiusKm: km })}
                  className={fchip(location.radiusKm === km, "disabled:opacity-60")}
                >
                  {km} km
                </button>
              ))}
            </div>
            <span aria-hidden className="hidden h-6 w-px bg-surface-3 sm:block" />
            <div role="group" aria-label="Ordenar" className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] font-bold text-text-strong">Ordenar:</span>
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={sort === s.id}
                  onClick={() => setSort(s.id)}
                  className={fchip(sort === s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <span className="hidden flex-1 lg:block" />
            <button
              type="button"
              role="switch"
              aria-checked={openNow}
              onClick={() => setOpenNow((v) => !v)}
              className="inline-flex h-8 items-center gap-2 text-[13px] font-bold text-text-2"
            >
              <span
                className={cn(
                  "flex h-5 w-[34px] items-center rounded-full p-0.5 transition-colors",
                  openNow ? "bg-primary" : "bg-border-strong",
                )}
              >
                <span
                  className={cn(
                    "size-4 rounded-full bg-white shadow transition-transform",
                    openNow && "translate-x-3.5",
                  )}
                />
              </span>
              Aberto agora
            </button>
          </div>
        </div>

        {noPlace ? (
          <NeedLocation />
        ) : loading ? (
          <TileSkeleton
            n={8}
            h="h-[360px]"
            className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          />
        ) : failed ? (
          <ErrorState
            error={query.error}
            title="Não foi possível carregar as ofertas"
            onRetry={() => query.refetch()}
          />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-surface px-4 py-10 text-center shadow-card">
            <p className="text-base font-bold text-text-strong">
              {filtered
                ? "Nenhuma oferta com esses filtros neste raio."
                : `Nenhuma oferta encontrada até ${location.radiusKm} km.`}
            </p>
            <p className="max-w-lg text-sm text-text-muted">
              {filtered
                ? "Tire a busca ou os filtros, amplie a distância ou peça o que você quer logo abaixo."
                : "Amplie a distância ou peça o que você quer logo abaixo e avisamos as lojas perto de você."}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 items-start gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, i) => (
              <li key={item.id} className="min-w-0">
                <OfferCard
                  item={item}
                  onOpen={() =>
                    track({
                      type: "SEARCH_RESULT_CLICK",
                      targetType: item.type === "product" ? "PRODUCT" : "STORE",
                      targetId: item.id,
                      props: { q: q || null, position: i + 1, sponsored: item.sponsored, source: "offers" },
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
        {!noPlace && query.hasNextPage && (
          <button
            type="button"
            disabled={query.isFetchingNextPage}
            onClick={() => query.fetchNextPage()}
            className="h-11 self-center rounded-lg border border-border-strong px-5 text-sm font-bold text-text-strong hover:bg-surface-2"
          >
            {query.isFetchingNextPage ? "Carregando…" : "Ver mais ofertas"}
          </button>
        )}
      </section>

      <section
        aria-label="Alerta de promoção"
        className="flex flex-col gap-4 rounded-2xl bg-primary px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:gap-5"
      >
        <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
          <Bell className="size-6" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-lg leading-[26px] font-extrabold text-white">
            Não achou o que queria em promoção?
          </h2>
          <p className="text-sm leading-5 text-navy-200">
            Diga o que procura. Avisamos as lojas perto que tem gente querendo — e você, assim que alguém
            criar a oferta.{" "}
            <Link
              href={`${routes.atividade}?aba=promocao`}
              className="font-bold whitespace-nowrap text-amber hover:underline"
            >
              Meus pedidos ›
            </Link>
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            openWant(alertTerm.trim());
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="text"
            value={alertTerm}
            onChange={(e) => setAlertTerm(e.target.value.slice(0, 60))}
            placeholder="Ex.: bicicleta, pizza, escova"
            aria-label="O que você quer em promoção"
            className="h-[46px] min-w-0 rounded-lg border-0 bg-surface px-3.5 text-sm text-text placeholder:text-text-subtle sm:w-[260px]"
          />
          <button
            type="submit"
            className="h-[46px] rounded-lg bg-accent px-[18px] text-sm font-extrabold whitespace-nowrap text-on-accent hover:bg-accent-hover"
          >
            Quero em promoção
          </button>
        </form>
      </section>

      {wantOpen && (
        <WantDialog
          initialTerm={wantTerm || q}
          radiusKm={location.radiusKm}
          returnTo={pathname}
          onClose={() => setWantOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-surface px-5 py-6 text-sm text-text-muted shadow-card">{children}</p>;
}
