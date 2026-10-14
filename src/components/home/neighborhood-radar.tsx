"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useUserLocation } from "@/hooks/use-user-location";
import { radar } from "@/lib/api/radar";
import { explorarHref } from "@/lib/domain/search-state";
import { growthText, priceChangeText, priceValueText, safeInternalHref } from "@/lib/domain/radar";
import { formatKm } from "@/lib/format";
import { lojaHref, prestadorHref } from "@/lib/routes";

/**
 * "Radar do bairro · O que está mudando perto de você". Três colunas, cada uma só aparece com dados reais
 * do servidor (preços com base de cálculo, buscas com volume mínimo, lugares com sinal). As três colunas ficam
 * sempre na tela, cada uma com seu estado: carregando, erro com "Tentar de novo", vazio ou dados.
 */
export function NeighborhoodRadar() {
  const { location, isLoading } = useUserLocation();
  const hasPlace = location.lat !== null || location.label.trim().length > 0;
  const area = { lat: location.lat, lng: location.lng, radiusKm: location.radiusKm };
  const on = !isLoading && hasPlace;
  const prices = useQuery({
    queryKey: ["radar", "prices", area],
    queryFn: () => radar.prices(area),
    enabled: on,
    retry: false,
  });
  const trending = useQuery({
    queryKey: ["radar", "trending", area],
    queryFn: () => radar.trending(area),
    enabled: on,
    retry: false,
  });

  const priceItems = prices.data?.items.slice(0, 5) ?? [];
  const searches = trending.data?.searches.slice(0, 5) ?? [];
  const places = trending.data?.places.slice(0, 5) ?? [];
  const areaName = trending.data?.area?.trim() || null;

  // Estado de cada coluna: carregando, erro (com nova tentativa), sem local, vazio ou com dados.
  const stateOf = (
    q: { isError: boolean; isPending: boolean; refetch: () => unknown },
    count: number,
  ): ColState =>
    !hasPlace && !isLoading
      ? { kind: "empty", text: "Defina seu local para ver o que está mudando perto de você." }
      : q.isError
        ? { kind: "error", retry: () => void q.refetch() }
        : q.isPending
          ? { kind: "loading" }
          : count === 0
            ? {
                kind: "empty",
                text: "Ainda não há dados suficientes no seu bairro. Aparecem aqui quando houver base real.",
              }
            : { kind: "ready" };
  const priceState = stateOf(prices, priceItems.length);
  const searchState = stateOf(trending, searches.length);
  const placeState = stateOf(trending, places.length);

  return (
    <section aria-labelledby="bairro-title" className="flex flex-col gap-4">
      <div>
        <h2 id="bairro-title" className="text-xl font-bold text-text-strong">
          Radar do bairro
        </h2>
        <p className="text-sm text-text-muted">O que está mudando perto de você</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Column title="Preços no bairro" state={priceState}>
          {priceItems.map((p) => {
            const href =
              safeInternalHref(p.href) ?? explorarHref({ q: p.item, specialty: [], sort: "relevance" });
            const change = priceChangeText(p);
            return (
              <li key={p.item}>
                <Link
                  href={href}
                  className="flex items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-selected"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-strong">{p.item}</span>
                    <span className="block truncate text-xs text-text-muted">{p.basis}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-text-strong">{priceValueText(p)}</span>
                    {change && (
                      <span
                        className={
                          p.direction === "down" ? "text-xs text-success-text" : "text-xs text-danger-text"
                        }
                      >
                        {change}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </Column>
        <Column
          title={areaName ? `Mais procurados no ${areaName} esta semana` : "Mais procurados esta semana"}
          state={searchState}
        >
          {searches.map((s) => (
            <li key={s.term}>
              <Link
                href={explorarHref({ q: s.term, specialty: [], sort: "relevance" })}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-selected"
              >
                <span className="truncate text-sm font-semibold text-text-strong">{s.term}</span>
                {growthText(s.growthPct) && (
                  <span className="shrink-0 text-xs font-semibold text-success-text">
                    {growthText(s.growthPct)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </Column>
        <Column title="Lugares chamando atenção" state={placeState}>
          {places.map((p) => (
            <li key={p.profile.id}>
              <Link
                href={p.profile.kind === "store" ? lojaHref(p.profile.slug) : prestadorHref(p.profile.slug)}
                className="block rounded-lg px-2 py-1.5 hover:bg-selected"
              >
                <span className="block truncate text-sm font-semibold text-text-strong">
                  {p.profile.name}
                </span>
                <span className="block truncate text-xs text-text-muted">
                  {[p.signal, p.branch, p.distanceKm != null ? formatKm(p.distanceKm) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </Column>
      </div>
    </section>
  );
}

type ColState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "empty"; text: string }
  | { kind: "error"; retry: () => void };

function Column({ title, state, children }: { title: string; state: ColState; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <h3 className="px-2 pb-1 text-sm font-bold text-text-strong">{title}</h3>
      {state.kind === "ready" ? (
        <ul className="flex flex-col">{children}</ul>
      ) : state.kind === "loading" ? (
        <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-2 px-2 py-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : state.kind === "error" ? (
        <div role="alert" className="flex flex-col items-start gap-2 px-2 py-3 text-sm text-text-muted">
          <p>Não foi possível carregar agora.</p>
          <button
            type="button"
            onClick={state.retry}
            className="h-10 rounded-lg border border-primary px-4 text-sm font-bold text-text-strong hover:bg-surface-2"
          >
            Tentar de novo
          </button>
        </div>
      ) : (
        <p className="px-2 py-3 text-sm text-text-muted">{state.text}</p>
      )}
    </div>
  );
}
