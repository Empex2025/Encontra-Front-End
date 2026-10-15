"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Minus, Radar as RadarIcon, TrendingUp } from "lucide-react";
import Link from "next/link";

import { cn } from "@/components/ui/cn";
import { InlineError, ListSkeleton } from "@/components/ui/inline-state";
import { useUserLocation } from "@/hooks/use-user-location";
import { radar, type Prices } from "@/lib/api/radar";
import { explorarHref } from "@/lib/domain/search-state";
import { sectionState, type SectionState } from "@/lib/domain/section-state";
import { growthText, safeInternalHref } from "@/lib/domain/radar";
import { formatKm, formatMoney } from "@/lib/format";
import { lojaHref, prestadorHref, routes } from "@/lib/routes";

import { SectionHeader } from "./section-header";

type PriceItem = Prices["items"][number];

const pct = (n: number) =>
  Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Minigráfico dos preços recentes. A cor segue o sentido: caiu = verde, subiu = vermelho, estável = cinza. */
function Sparkline({ values, direction }: { values: number[]; direction: PriceItem["direction"] }) {
  const w = 72;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map(
      (v, i) =>
        `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden
      className={cn(
        "hidden shrink-0 sm:block",
        direction === "down" ? "text-success" : direction === "up" ? "text-danger" : "text-text-subtle",
      )}
    >
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChangeChip({ p }: { p: PriceItem }) {
  if (p.direction === "flat" || p.changePct === null || p.changePct === undefined) {
    return p.direction === "flat" ? (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-3 px-2 text-[11px] leading-5 font-bold text-text-muted">
        <Minus className="size-3" aria-hidden /> estável
      </span>
    ) : null;
  }
  const down = p.direction === "down";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 text-[11px] leading-5 font-bold",
        down ? "bg-success-soft text-success-text" : "bg-danger-soft text-danger-text",
      )}
    >
      {down ? <ArrowDown className="size-3" aria-hidden /> : <ArrowUp className="size-3" aria-hidden />}
      {down ? "−" : "+"}
      {pct(p.changePct)}%<span className="sr-only">{p.period ? ` em ${p.period}` : ""}</span>
    </span>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/**
 * "Radar do bairro · O que está mudando perto de você" (protótipo): faixa de destaque, depois três colunas. Cada
 * parte só aparece com dados reais do servidor (preços com base de cálculo, buscas com volume mínimo, lugares com
 * sinal). Cada coluna mostra carregando, erro (com "Tentar de novo") ou vazio; a estrutura nunca some.
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
  const headline = prices.data?.headline ?? null;
  const headlineHref = safeInternalHref(headline?.href) ?? routes.explorar;
  const emptyText = hasPlace
    ? "Ainda não há dados suficientes no seu bairro. Aparece aqui quando houver base real."
    : "Defina seu local para ver o que está mudando perto de você.";

  return (
    <section aria-labelledby="bairro-title" className="flex flex-col gap-4">
      <SectionHeader
        id="bairro-title"
        eyebrow="Radar do bairro"
        icon={RadarIcon}
        title="O que está mudando perto de você"
        subtitle="Preços que subiram ou caíram, o que as pessoas mais procuram e os lugares que estão chamando atenção."
      />

      {headline && (
        <Link
          href={headlineHref}
          className={cn(
            "flex items-center gap-3.5 rounded-[14px] border px-[18px] py-3.5",
            headline.direction === "down" ? "border-success bg-success-soft" : "border-danger bg-danger-soft",
          )}
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg text-white",
              headline.direction === "down" ? "bg-success" : "bg-danger",
            )}
          >
            {headline.direction === "down" ? (
              <ArrowDown className="size-5" aria-hidden />
            ) : (
              <ArrowUp className="size-5" aria-hidden />
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={cn(
                "text-[15px] leading-[22px] font-bold",
                headline.direction === "down" ? "text-success-text" : "text-danger-text",
              )}
            >
              {headline.title}
            </span>
            {headline.detail && (
              <span className="text-[13px] leading-5 text-text-muted">{headline.detail}</span>
            )}
          </span>
          <span className="shrink-0 text-[13px] font-bold text-text-strong">Ver preços ›</span>
        </Link>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <Column
          title="Preços no bairro"
          state={sectionState(prices, on, priceItems.length)}
          onRetry={() => void prices.refetch()}
          emptyText={emptyText}
          footer={
            priceItems.length > 0
              ? "Calculado com os preços informados pelas lojas perto de você. Verde = ficou mais barato."
              : undefined
          }
        >
          {priceItems.map((p) => {
            const href =
              safeInternalHref(p.href) ?? explorarHref({ q: p.item, specialty: [], sort: "relevance" });
            return (
              <li key={p.item}>
                <Link
                  href={href}
                  className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm leading-5 font-bold text-text">{p.item}</span>
                    <span className="block truncate text-[11px] leading-4 text-text-subtle">{p.basis}</span>
                  </span>
                  {p.series && <Sparkline values={p.series} direction={p.direction} />}
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-sm leading-5 font-bold text-text-strong">
                      {formatMoney(p.valueCents)}
                    </span>
                    <ChangeChip p={p} />
                  </span>
                </Link>
              </li>
            );
          })}
        </Column>
        <Column
          title={areaName ? `Mais procurados no ${areaName} esta semana` : "Mais procurados esta semana"}
          state={sectionState(trending, on, searches.length)}
          onRetry={() => void trending.refetch()}
          emptyText={emptyText}
        >
          {searches.map((s, i) => (
            <li key={s.term}>
              <Link
                href={explorarHref({ q: s.term, specialty: [], sort: "relevance" })}
                className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-surface-2"
              >
                <span aria-hidden className="w-5 shrink-0 text-lg font-bold text-border-strong">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] leading-5 font-bold text-text-strong">
                    {s.term}
                  </span>
                  <span className="block text-xs leading-4 text-text-subtle">
                    {s.searches.toLocaleString("pt-BR")} buscas
                  </span>
                </span>
                {growthText(s.growthPct) && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2 text-[11px] leading-5 font-bold text-success-text">
                    <TrendingUp className="size-3" aria-hidden />
                    {growthText(s.growthPct)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </Column>
        <Column
          title="Lugares chamando atenção"
          state={sectionState(trending, on, places.length)}
          onRetry={() => void trending.refetch()}
          emptyText={emptyText}
        >
          {places.map((p) => (
            <li key={p.profile.id}>
              <Link
                href={p.profile.kind === "store" ? lojaHref(p.profile.slug) : prestadorHref(p.profile.slug)}
                className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-surface-2"
              >
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-on-primary"
                >
                  {initials(p.profile.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm leading-5 font-bold text-text">
                    {p.profile.name}
                  </span>
                  <span className="block truncate text-xs leading-4 font-bold text-success-text">
                    {[p.signal, p.branch, p.distanceKm != null ? formatKm(p.distanceKm) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </Column>
      </div>
    </section>
  );
}

function Column({
  title,
  state,
  onRetry,
  emptyText,
  footer,
  children,
}: {
  title: string;
  state: SectionState;
  onRetry: () => void;
  emptyText: string;
  footer?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-surface p-5 shadow-card">
      <h3 className="pb-1 text-[17px] leading-6 font-bold text-text-strong">{title}</h3>
      {state === "ready" ? (
        <>
          <ul className="flex flex-col">{children}</ul>
          {footer && <p className="pt-1 text-[11px] leading-4 text-text-subtle">{footer}</p>}
        </>
      ) : state === "loading" ? (
        <ListSkeleton rows={3} label={`Carregando: ${title}`} />
      ) : state === "error" ? (
        <InlineError message="Não foi possível carregar esta lista." onRetry={onRetry} />
      ) : (
        <p className="py-3 text-sm text-text-muted">{emptyText}</p>
      )}
    </div>
  );
}
