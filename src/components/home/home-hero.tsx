"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Navigation, Search, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { useDismiss } from "@/components/ui/use-dismiss";
import { useUserLocation } from "@/hooks/use-user-location";
import { endpoints, queryKeys } from "@/lib/api/endpoints";
import {
  addToHistory,
  clearHistory,
  HISTORY_SHOWN,
  readHistory,
  removeFromHistory,
} from "@/lib/domain/search-history";
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

type Row = { text: string; hint?: string; kind: "hist" | "trend" | "sugg" };

/** Texto com o trecho digitado em negrito (sem acento nem maiúscula na comparação). */
function Highlight({ text, term }: { text: string; term: string }) {
  const fold = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const i = term ? fold(text).indexOf(fold(term)) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <b>{text.slice(i, i + term.length)}</b>
      {text.slice(i + term.length)}
    </>
  );
}

const panelCls =
  "absolute top-[58px] z-40 flex w-full flex-col gap-0.5 rounded-[20px] bg-surface p-2.5 text-left text-text shadow-pop ring-1 ring-black/5 md:-left-1 md:w-[520px]";
const optCls = "flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-left hover:bg-surface-2";

/**
 * Destaque da Home (protótipo): título, barra de busca com DOIS campos ("O que você procura?" e "Bairro ou cidade")
 * mais o botão âmbar "Buscar", e os atalhos. Buscar com o campo vazio também leva ao Explorar, igual ao Enter.
 */
export function HomeHero() {
  const router = useRouter();
  const { location, save } = useUserLocation();
  const [q, setQ] = useState("");
  const [where, setWhere] = useState(location.label);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null } | null>(null);
  const [open, setOpen] = useState<"q" | "w" | null>(null);
  const [active, setActive] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const [gpsMsg, setGpsMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const listId = useId();

  // O local salvo (do cabeçalho, do GPS ou do servidor) aparece no campo quando muda.
  const [shownLabel, setShownLabel] = useState(location.label);
  if (shownLabel !== location.label) {
    setShownLabel(location.label);
    setWhere(location.label);
    setCoords(null);
  }

  useEffect(() => {
    queueMicrotask(() => setHistory(readHistory().slice(0, HISTORY_SHOWN)));
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    setActive(-1);
  }, []);
  useDismiss(formRef, open !== null, close);

  const term = useDeferredValue(q.trim());
  const sugg = useQuery({
    queryKey: queryKeys.autocomplete(term),
    queryFn: () => endpoints.autocomplete(term),
    enabled: open === "q",
  });

  const placeTerm = useDeferredValue(where.trim());
  const places = useQuery({
    queryKey: queryKeys.places(placeTerm),
    queryFn: () => endpoints.placeAutocomplete(placeTerm),
    enabled: open === "w" && placeTerm.length >= 2 && placeTerm !== location.label,
  });
  const placeRows = (places.data?.items ?? []).map((p) => p.label).slice(0, 5);

  const rows: Row[] = term
    ? (sugg.data?.items ?? []).map((s) => ({ text: s.text, hint: s.hint, kind: "sugg" }))
    : [
        ...history.map((t) => ({ text: t, kind: "hist" as const })),
        ...(sugg.data?.trending ?? []).map((t) => ({ text: t, kind: "trend" as const })),
      ];

  const go = (text: string) => {
    const t = text.trim();
    if (t) addToHistory(t);
    // Local digitado: vira o local do usuário antes de buscar (o Explorar lê o mesmo local).
    const w = where.trim();
    if (coords && w) save.mutate({ label: w, lat: coords.lat, lng: coords.lng, radiusKm: location.radiusKm });
    else if (w && w !== location.label)
      save.mutate({ label: w, lat: null, lng: null, radiusKm: location.radiusKm });
    close();
    router.push(t ? explorarComBusca(t) : routes.explorar);
  };

  const useGps = () => {
    if (!("geolocation" in navigator)) {
      setGpsMsg("Seu navegador não permite usar a localização.");
      return;
    }
    setGpsMsg("Buscando sua localização…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // O nome do bairro virá de GET /geo/reverse quando o back-end estiver pronto.
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setWhere("Minha localização atual");
        setGpsMsg("");
        close();
      },
      () => setGpsMsg("Não foi possível pegar sua localização. Digite o bairro ou a cidade."),
      { timeout: 8000 },
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return close();
    if (open !== "q" || rows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % rows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(rows[active].text);
    }
  };

  const firstTrend = rows.findIndex((r) => r.kind === "trend");
  const showWhere = where.trim() || "perto de você";

  return (
    <>
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
        ref={formRef}
        role="search"
        aria-labelledby="home-title"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="relative z-30 mx-auto flex w-full max-w-[920px] flex-col gap-1 rounded-3xl border border-border bg-surface p-2 shadow-pop focus-within:ring-[3px] focus-within:ring-amber/60 md:h-16 md:flex-row md:items-center md:rounded-full md:py-0 md:pr-2 md:pl-1"
      >
        <label className="relative flex h-12 min-w-0 flex-1 cursor-text items-center gap-2.5 px-4 md:h-full md:pr-4 md:pl-5">
          <Search className="size-[18px] shrink-0 text-navy-500" aria-hidden />
          <span className="sr-only">O que você procura?</span>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value.slice(0, 80));
              setOpen("q");
              setActive(-1);
            }}
            onFocus={() => {
              setHistory(readHistory().slice(0, HISTORY_SHOWN));
              setOpen("q");
            }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={open === "q"}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            placeholder="O que você procura? Produto, serviço ou lugar…"
            autoComplete="off"
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-navy-300 focus-visible:outline-none"
          />

          {open === "q" && (
            <div
              id={listId}
              role="listbox"
              aria-label="Sugestões"
              className={panelCls}
              onMouseDown={(e) => e.preventDefault()}
            >
              {term && (
                <button
                  type="button"
                  onClick={() => go(q)}
                  className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-left hover:bg-surface-2"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy">
                    <Search className="size-[18px] text-amber" strokeWidth={2.4} aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] leading-[22px] font-bold text-text-strong">
                      Buscar “{term}”
                    </span>
                    <span className="truncate text-xs leading-4 text-text-subtle">
                      em {showWhere} · produtos, serviços e lugares
                    </span>
                  </span>
                </button>
              )}
              {rows.map((r, i) => (
                <div key={`${r.kind}-${r.text}`} role="presentation">
                  {i === 0 && r.kind === "hist" && (
                    <p className="flex items-center justify-between px-3 pt-1 pb-2 text-[11px] leading-4 font-bold tracking-[0.4px] text-text-subtle uppercase">
                      Buscas recentes
                      <button
                        type="button"
                        onClick={() => setHistory(clearHistory())}
                        className="text-xs font-bold tracking-normal text-link normal-case hover:underline"
                      >
                        Limpar
                      </button>
                    </p>
                  )}
                  {i === (term ? 0 : firstTrend) && r.kind !== "hist" && (
                    <p className="px-3 pt-2 pb-2 text-[11px] leading-4 font-bold tracking-[0.4px] text-text-subtle uppercase">
                      {term ? "Sugestões" : "Buscas populares perto de você"}
                    </p>
                  )}
                  <div className="flex items-center">
                    <button
                      type="button"
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onClick={() => go(r.text)}
                      className={cn(optCls, i === active && "bg-surface-2")}
                    >
                      <span
                        className={cn(
                          "flex shrink-0 items-center justify-center bg-surface-2",
                          r.kind === "hist" ? "size-8 rounded-full" : "size-11 rounded-xl",
                        )}
                      >
                        {r.kind === "hist" ? (
                          <Clock className="size-4 text-text-subtle" aria-hidden />
                        ) : r.kind === "trend" ? (
                          <TrendingUp className="size-[18px] text-text-2" aria-hidden />
                        ) : (
                          <Search className="size-[18px] text-text-2" aria-hidden />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[15px] leading-[22px] text-text">
                          {r.kind === "sugg" ? <Highlight text={r.text} term={term} /> : r.text}
                        </span>
                        {r.hint && (
                          <span className="truncate text-xs leading-4 text-text-subtle">{r.hint}</span>
                        )}
                      </span>
                    </button>
                    {r.kind === "hist" && (
                      <button
                        type="button"
                        onClick={() => setHistory(removeFromHistory(r.text).slice(0, HISTORY_SHOWN))}
                        aria-label={`Remover “${r.text}” do histórico`}
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-text-subtle hover:bg-surface-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <p role="status" className="px-3 pt-1 pb-2 text-[13px] text-text-subtle">
                  {sugg.isError
                    ? "Não foi possível carregar sugestões. Digite o que procura e toque em “Buscar”."
                    : sugg.isPending
                      ? "Carregando sugestões…"
                      : term
                        ? "Sem sugestões. Toque em “Buscar” para procurar mesmo assim."
                        : "Sem buscas recentes por aqui. Digite o que procura."}
                </p>
              )}
            </div>
          )}
        </label>

        <span aria-hidden className="hidden h-6 w-px shrink-0 bg-border md:block" />

        <label className="relative flex h-12 shrink-0 cursor-text items-center gap-2 border-t border-border px-4 md:h-full md:w-[220px] md:border-t-0">
          <MapPin className="size-[18px] shrink-0 text-navy-500" aria-hidden />
          <span className="sr-only">Bairro ou cidade</span>
          <input
            type="text"
            value={where}
            onChange={(e) => {
              setWhere(e.target.value.slice(0, 80));
              setCoords(null);
              setOpen("w");
            }}
            onFocus={() => {
              setGpsMsg("");
              setOpen("w");
            }}
            onKeyDown={(e) => e.key === "Escape" && close()}
            placeholder="Bairro ou cidade"
            autoComplete="off"
            aria-haspopup="listbox"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-navy-300 focus-visible:outline-none"
          />
          {open === "w" && (
            <div
              role="listbox"
              aria-label="Locais"
              className={cn(panelCls, "md:-right-2 md:left-auto md:w-[380px]")}
              onMouseDown={(e) => e.preventDefault()}
            >
              <button type="button" onClick={useGps} className={optCls}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-selected">
                  <Navigation className="size-5 text-text-strong" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="text-[15px] leading-[22px] font-semibold text-text-strong">
                    Usar minha localização atual
                  </span>
                  <span className="text-xs leading-4 text-text-subtle">
                    Encontrar o que está perto de você
                  </span>
                </span>
              </button>
              {gpsMsg && (
                <p role="status" className="px-3 py-1 text-[13px] text-text-muted">
                  {gpsMsg}
                </p>
              )}
              {placeRows.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    setWhere(p);
                    setCoords(null);
                    close();
                  }}
                  className={optCls}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                    <MapPin className="size-5 text-text" aria-hidden />
                  </span>
                  <span className="truncate text-[15px] leading-[22px] text-text">
                    <Highlight text={p} term={placeTerm} />
                  </span>
                </button>
              ))}
              {places.isError && (
                <p role="status" className="px-3 py-2 text-[13px] text-text-muted">
                  Não foi possível buscar locais agora. Você ainda pode digitar o bairro ou a cidade.
                </p>
              )}
              {!places.isError &&
                placeTerm.length >= 2 &&
                placeTerm !== location.label &&
                !places.isPending &&
                placeRows.length === 0 && (
                  <p role="status" className="px-3 py-2 text-sm text-text-subtle">
                    Nenhum local encontrado. Tente outro nome.
                  </p>
                )}
            </div>
          )}
        </label>

        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-[22px] text-[15px] font-extrabold text-on-accent hover:bg-accent-hover"
        >
          <Search className="size-[18px]" strokeWidth={2.4} aria-hidden />
          Buscar
        </button>
      </form>

      <div
        role="group"
        aria-label="Atalhos"
        className="-mt-2 flex flex-wrap items-center justify-center gap-2"
      >
        <span className="text-[13px] font-semibold text-text-subtle">Atalhos:</span>
        {SHORTCUTS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => go(s.q)}
            className="h-8 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-text-strong hover:border-navy-300 hover:bg-surface-2"
          >
            {s.label}
          </button>
        ))}
      </div>
    </>
  );
}
