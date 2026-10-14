"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { Avatar } from "@/components/catalog/avatar";
import { CouponCard } from "@/components/catalog/coupon-card";
import { ResultCard, ResultCardSkeleton, targetTypeOf } from "@/components/search/result-card";
import { WantDialog } from "@/components/search/want-dialog";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { NeedLocation } from "@/components/ui/need-location";
import { useUserLocation } from "@/hooks/use-user-location";
import { track } from "@/lib/analytics/track";
import { fetchOffers, OFFER_SORTS, type OfferSort } from "@/lib/api/catalog";
import { CATEGORIES } from "@/lib/domain/categories";
import { lojaHref } from "@/lib/routes";

const SORT_LABEL: Record<OfferSort, string> = {
  relevance: "Mais relevantes",
  distance: "Mais perto",
  price: "Menor preço",
  discount: "Maior desconto",
};

export function OffersView() {
  const { location, isLoading } = useUserLocation();
  const ready = !isLoading;
  const requireAuth = useRequireAuth();
  const pathname = usePathname();
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | undefined>();
  const [sort, setSort] = useState<OfferSort>("relevance");
  const [openNow, setOpenNow] = useState(false);
  const [wantOpen, setWantOpen] = useState(false);

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
  const status = query.isError ? "error" : query.isPending ? "loading" : "ready";

  const first = query.data?.pages[0];
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const cats = Object.entries(first?.facets.categories ?? {}).filter(([, n]) => n > 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-strong">Ofertas &amp; Promoções</h1>
        <p className="text-text-muted">
          Descontos, cupons e preços baixos das lojas e prestadores perto de você
          {location.label ? ` · Perto de ${location.label}` : ""}.
        </p>
      </header>

      <section aria-labelledby="cupons-t" className="flex flex-col gap-3">
        <h2 id="cupons-t" className="text-lg font-bold text-text-strong">
          Cupons do dia
        </h2>
        {first && first.coupons.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {first.coupons.map((c) => (
              <li key={c.id} className="flex flex-col gap-2">
                <Link
                  href={lojaHref(c.profile.slug)}
                  className="flex items-center gap-2 text-sm font-semibold text-text-strong hover:underline"
                >
                  <Avatar name={c.profile.name} url={c.profile.avatarUrl} size={28} />
                  {c.profile.name}
                </Link>
                <CouponCard coupon={c} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-5 text-sm text-text-muted">
            {noPlace
              ? "Defina seu local para ver os cupons perto de você."
              : status === "loading"
                ? "Carregando cupons…"
                : status === "error"
                  ? "Não foi possível carregar os cupons agora. Use “Tentar de novo” na lista abaixo."
                  : "Nenhum cupom disponível agora neste raio."}
          </p>
        )}
      </section>

      <section aria-labelledby="todas-t" className="flex flex-col gap-4">
        <h2 id="todas-t" className="text-lg font-bold text-text-strong">
          Todas as ofertas
          {first
            ? ` — ${first.total} ${first.total === 1 ? "oferta" : "ofertas"} até ${location.radiusKm} km`
            : ""}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Buscar ofertas</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar ofertas"
              className="h-11 w-full rounded-lg border border-border-strong bg-surface pr-3 pl-9 text-text"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-text-muted">
            Ordenar
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as OfferSort)}
              className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-text"
            >
              {OFFER_SORTS.map((s) => (
                <option key={s} value={s}>
                  {SORT_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-11 items-center gap-2 text-sm font-semibold text-text">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="size-4"
            />
            Aberto agora
          </label>
        </div>
        <ul className="flex flex-wrap items-center gap-2" aria-label="Categorias">
          <li>
            <button
              type="button"
              aria-pressed={!cat}
              onClick={() => setCat(undefined)}
              className={chip(!cat)}
            >
              Todas
            </button>
          </li>
          {cats.map(([id, n]) => (
            <li key={id}>
              <button
                type="button"
                aria-pressed={cat === id}
                onClick={() => setCat(id)}
                className={chip(cat === id)}
              >
                {CATEGORIES.find((c) => c.id === id)?.name ?? id} ({n})
              </button>
            </li>
          ))}
          {cats.length === 0 && (
            <li className="text-xs text-text-subtle">
              {status === "ready"
                ? "Sem categorias com ofertas neste raio"
                : "Categorias aparecem com os resultados"}
            </li>
          )}
        </ul>

        {noPlace ? (
          <NeedLocation />
        ) : query.isPending || !ready ? (
          <div
            className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
            aria-label="Carregando ofertas"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            error={query.error}
            title="Não foi possível carregar as ofertas"
            onRetry={() => query.refetch()}
          />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border p-8 text-center">
            <p className="font-bold text-text-strong">
              {q || cat || openNow
                ? "Nenhuma oferta com esses filtros neste raio."
                : `Nenhuma oferta encontrada até ${location.radiusKm} km.`}
            </p>
            <p className="text-sm text-text-muted">
              {q || cat || openNow
                ? "Tire a busca ou os filtros, ou amplie a distância no topo da página. Se ainda assim não achar, peça e avisamos as lojas perto de você."
                : "Amplie a distância no topo da página ou peça o que você quer e avisamos as lojas perto de você."}
            </p>
            <button
              type="button"
              onClick={() => requireAuth("want", "ofertas") && setWantOpen(true)}
              className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-hover"
            >
              Quero em promoção
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <li key={item.id}>
                <ResultCard
                  item={item}
                  onOpen={() =>
                    track({
                      type: "SEARCH_RESULT_CLICK",
                      targetType: targetTypeOf(item),
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
            className="self-center rounded-lg border border-border-strong px-5 py-2.5 text-sm font-bold"
          >
            {query.isFetchingNextPage ? "Carregando…" : "Ver mais ofertas"}
          </button>
        )}
        {!noPlace && items.length > 0 && (
          <p className="text-sm text-text-muted">
            Não achou o desconto que queria?{" "}
            <button
              type="button"
              onClick={() => requireAuth("want", "ofertas") && setWantOpen(true)}
              className="font-bold text-link hover:underline"
            >
              Quero em promoção
            </button>
          </p>
        )}
      </section>
      {wantOpen && (
        <WantDialog
          initialTerm={q}
          radiusKm={location.radiusKm}
          returnTo={pathname}
          onClose={() => setWantOpen(false)}
        />
      )}
    </div>
  );
}

const chip = (on: boolean) =>
  cn(
    "h-10 rounded-full border px-4 text-sm font-semibold",
    on
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-text hover:bg-surface-2",
  );
