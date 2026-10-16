"use client";

import { useQuery } from "@tanstack/react-query";
import { History, MapPin, Search, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

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

/**
 * Cartão de abertura da Home, como no protótipo: título, busca de dois campos (o quê + onde), atalhos e,
 * logo abaixo, as categorias e o mapa (`children`). Buscar com o campo vazio também leva ao Explorar.
 */
export function HomeHero({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const { location } = useUserLocation();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setFocus(false);
    router.push(t ? explorarComBusca(t) : routes.explorar);
  };

  const place = location.label.trim();
  const openPlace = () => window.dispatchEvent(new Event(OPEN_LOCATION_EVENT));
  const open = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFocus(true);
  };
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setFocus(false), 150);
  };

  return (
    <section
      aria-labelledby="home-title"
      className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-4 sm:p-8"
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1
          id="home-title"
          className="text-2xl leading-8 font-bold text-text-strong sm:text-[28px] sm:leading-9"
        >
          O que você procura perto de você?
        </h1>
        <p className="text-[15px] leading-[22px] text-text-muted">
          Produtos, serviços, lugares e experiências. Você escreve, a gente entende.
        </p>
      </div>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="relative z-30 flex w-full flex-col gap-2 self-center rounded-3xl border border-border bg-surface p-2 shadow-pop sm:h-16 sm:max-w-[920px] sm:flex-row sm:items-center sm:rounded-full sm:py-0 sm:pr-2 sm:pl-1"
      >
        <label className="relative flex h-12 min-w-0 flex-1 items-center gap-2.5 px-4 sm:h-full sm:pr-4 sm:pl-5">
          <Search className="size-[18px] shrink-0 text-text-subtle" aria-hidden />
          <span className="sr-only">O que você procura?</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value.slice(0, 80))}
            onFocus={open}
            onBlur={closeSoon}
            placeholder="O que você procura? Produto, serviço ou lugar…"
            autoComplete="off"
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-text-subtle"
          />
          {focus && (
            <div
              role="listbox"
              aria-label="Sugestões"
              className="absolute top-[58px] -left-1 z-40 flex w-full max-w-[520px] flex-col gap-0.5 rounded-[20px] bg-surface p-2.5 text-left shadow-pop ring-1 ring-black/5"
            >
              <p className="px-2.5 pt-1 pb-0.5 text-xs font-bold text-text-subtle">Buscas recentes</p>
              {history.length > 0 ? (
                history.map((t) => (
                  <Suggestion key={t} onPick={() => go(t)} icon={<History className="size-4" aria-hidden />}>
                    {t}
                  </Suggestion>
                ))
              ) : (
                <p className="px-2.5 py-1.5 text-sm text-text-muted">Nenhuma busca ainda neste aparelho</p>
              )}
              <p className="px-2.5 pt-2 pb-0.5 text-xs font-bold text-text-subtle">
                Buscas populares perto de você
              </p>
              {popular.length > 0 ? (
                popular.map((t) => (
                  <Suggestion
                    key={t}
                    onPick={() => go(t)}
                    icon={<TrendingUp className="size-4" aria-hidden />}
                  >
                    {t}
                  </Suggestion>
                ))
              ) : trending.isError ? (
                <p role="alert" className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-text-muted">
                  Não foi possível carregar.
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void trending.refetch()}
                    className="font-semibold text-link underline"
                  >
                    Tentar de novo
                  </button>
                </p>
              ) : (
                <p className="px-2.5 py-1.5 text-sm text-text-muted">
                  {trending.isPending ? "Carregando…" : "Sem dados disponíveis"}
                </p>
              )}
            </div>
          )}
        </label>
        <span aria-hidden className="hidden h-8 w-px bg-border sm:block" />
        <button
          type="button"
          onClick={openPlace}
          className="flex h-12 min-w-0 items-center gap-2.5 px-4 text-left text-base sm:h-full sm:w-[260px] sm:shrink-0"
        >
          <MapPin className="size-[18px] shrink-0 text-accent-text" aria-hidden />
          <span className="sr-only">Localidade: </span>
          <span className={place ? "truncate text-text" : "truncate text-text-subtle"}>
            {place || "Bairro ou cidade"}
          </span>
          <span className="shrink-0 text-sm whitespace-nowrap text-text-muted">· {location.radiusKm} km</span>
        </button>
        <button
          type="submit"
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-base font-bold text-on-accent hover:bg-accent-hover"
        >
          <Search className="size-[18px]" aria-hidden />
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Atalhos">
        <span className="text-sm font-semibold text-text-muted">Atalhos:</span>
        {SHORTCUTS.map((s) => (
          <Pill key={s.label} onClick={() => go(s.q)}>
            {s.label}
          </Pill>
        ))}
      </div>

      {children}
    </section>
  );
}

function Suggestion({
  onPick,
  icon,
  children,
}: {
  onPick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={false}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className="flex h-10 items-center gap-2.5 rounded-xl px-2.5 text-left text-sm text-text hover:bg-surface-2"
    >
      <span className="text-text-subtle">{icon}</span>
      {children}
    </button>
  );
}

function Pill({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3.5 text-[13px] font-semibold text-text-strong hover:bg-surface-2"
    >
      {children}
    </button>
  );
}
