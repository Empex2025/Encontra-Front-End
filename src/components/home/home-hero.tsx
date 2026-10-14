"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, History, MapPin, Search, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OPEN_LOCATION_EVENT } from "@/components/layout/location-picker";
import { useUserLocation } from "@/hooks/use-user-location";
import { endpoints, queryKeys } from "@/lib/api/endpoints";
import { addToHistory, HISTORY_SHOWN, readHistory } from "@/lib/domain/search-history";
import { explorarComBusca, routes } from "@/lib/routes";

/** Atalhos fixos da Home: texto que a pessoa vê → o que é buscado (conteúdo genuinamente fixo). */
const SHORTCUTS = [
  { label: "Onde almoçar", q: "almoço" },
  { label: "Postos perto", q: "posto de combustível" },
  { label: "Eletricista", q: "eletricista" },
  { label: "Farmácia 24h", q: "farmácia 24h" },
  { label: "Pet shop", q: "pet shop" },
  { label: "Barbearia", q: "barbearia" },
] as const;

/** Destaque com busca. Buscar com o campo vazio também leva ao Explorar, igual ao Enter. */
export function HomeHero() {
  const router = useRouter();
  const { location } = useUserLocation();
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => setHistory(readHistory().slice(0, HISTORY_SHOWN)));
  }, []);

  const trending = useQuery({
    queryKey: queryKeys.autocomplete(""),
    queryFn: () => endpoints.autocomplete(""),
  });
  const popular = (trending.data?.trending ?? []).slice(0, 5);

  const go = (text: string) => {
    const t = text.trim();
    if (t) addToHistory(t);
    router.push(t ? explorarComBusca(t) : routes.explorar);
  };

  const place = location.label.trim();

  return (
    <section aria-labelledby="home-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 id="home-title" className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">
          O que você procura perto de você?
        </h1>
        <p className="text-base text-text-muted">
          Produtos, serviços, lugares e experiências. Você escreve, a gente entende.
        </p>
      </div>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-2 shadow-card sm:flex-row sm:items-center"
      >
        <label className="flex h-12 flex-1 items-center gap-2 rounded-xl px-3 focus-within:ring-2 focus-within:ring-focus/40">
          <Search className="size-5 shrink-0 text-text-subtle" aria-hidden />
          <span className="sr-only">O que você procura?</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value.slice(0, 80))}
            placeholder="Ex.: tênis de corrida, eletricista, pizza"
            autoComplete="off"
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-text-subtle"
          />
        </label>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_LOCATION_EVENT))}
          className="flex h-12 items-center gap-2 rounded-xl border border-border px-3 text-left text-sm hover:bg-surface-2 sm:max-w-[16rem]"
        >
          <MapPin className="size-4 shrink-0 text-accent-text" aria-hidden />
          <span className="sr-only">Localidade: </span>
          <span className="truncate font-semibold text-text">{place || "Definir local"}</span>
          <span className="shrink-0 whitespace-nowrap text-text-muted">· {location.radiusKm} km</span>
          <ChevronDown className="size-4 shrink-0 text-text-subtle" aria-hidden />
        </button>
        <button
          type="submit"
          className="h-12 rounded-xl bg-primary px-6 text-base font-bold text-on-primary hover:bg-primary-hover"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <ChipRow label="Atalhos">
          {SHORTCUTS.map((s) => (
            <Pill key={s.label} onClick={() => go(s.q)}>
              {s.label}
            </Pill>
          ))}
        </ChipRow>
        <ChipRow label="Buscas recentes">
          {history.length > 0 ? (
            history.map((t) => (
              <Pill key={t} onClick={() => go(t)} icon={<History className="size-3.5" aria-hidden />}>
                {t}
              </Pill>
            ))
          ) : (
            <span className="text-sm text-text-muted">Nenhuma busca ainda neste aparelho</span>
          )}
        </ChipRow>
        <ChipRow label="Buscas populares perto de você">
          {popular.length > 0 ? (
            popular.map((t) => (
              <Pill key={t} onClick={() => go(t)} icon={<TrendingUp className="size-3.5" aria-hidden />}>
                {t}
              </Pill>
            ))
          ) : trending.isError ? (
            <span className="inline-flex items-center gap-2 text-sm text-text-muted" role="alert">
              Não foi possível carregar.
              <button
                type="button"
                onClick={() => void trending.refetch()}
                className="h-10 font-semibold text-link underline"
              >
                Tentar de novo
              </button>
            </span>
          ) : (
            <span className="text-sm text-text-muted">
              {trending.isPending ? "Carregando…" : "Sem dados disponíveis"}
            </span>
          )}
        </ChipRow>
      </div>
    </section>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="text-sm font-semibold text-text-muted">{label}:</span>
      {children}
    </div>
  );
}

function Pill({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-medium text-text hover:bg-surface-2"
    >
      {icon}
      {children}
    </button>
  );
}
