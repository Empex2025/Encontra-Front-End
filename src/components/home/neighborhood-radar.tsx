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
 * do servidor (preços com base de cálculo, buscas com volume mínimo, lugares com sinal). Tudo vazio: a seção fica com uma mensagem de estado vazio.
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
  const nothing = priceItems.length + searches.length + places.length === 0;

  return (
    <section aria-labelledby="bairro-title" className="flex flex-col gap-4">
      <div>
        <h2 id="bairro-title" className="text-xl font-bold text-text-strong">
          Radar do bairro
        </h2>
        <p className="text-sm text-text-muted">O que está mudando perto de você</p>
      </div>
      {nothing && (
        <p className="rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-6 text-sm text-text-muted">
          {hasPlace
            ? "Ainda não há dados suficientes no seu bairro. Preços e buscas aparecem aqui quando houver base real."
            : "Defina seu local para ver o que está mudando perto de você."}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {priceItems.length > 0 && (
          <Column title="Preços no bairro">
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
        )}
        {searches.length > 0 && (
          <Column
            title={areaName ? `Mais procurados no ${areaName} esta semana` : "Mais procurados esta semana"}
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
        )}
        {places.length > 0 && (
          <Column title="Lugares chamando atenção">
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
        )}
      </div>
    </section>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <h3 className="px-2 pb-1 text-sm font-bold text-text-strong">{title}</h3>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}
