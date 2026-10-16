"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Navigation, Pencil, Search, TrendingUp, X } from "lucide-react";
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

import { DistanceButton } from "./distance-button";

type Row = { text: string; hint?: string; kind: "hist" | "trend" | "sugg" };

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
  "absolute top-[54px] z-40 flex w-[min(92vw,460px)] flex-col gap-0.5 rounded-3xl bg-surface p-3 text-left text-text shadow-pop ring-1 ring-black/5";
const optCls = "flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-left hover:bg-surface-2";
const headCls = "px-3 pt-1 pb-2 text-[11px] leading-4 font-bold tracking-[0.4px] text-text-subtle uppercase";

/**
 * Busca do Explorar (protótipo): em descoberta, o formulário aberto com DOIS campos ("O que você procura" e
 * "Onde"), "Cancelar" e o botão âmbar "Buscar"; depois de buscar, a pílula recolhida com "Nova busca". À direita,
 * "Distância". Buscar com o campo vazio volta à descoberta.
 */
export function ExplorarSearch({
  q,
  radiusKm,
  onSubmit,
}: {
  q: string;
  radiusKm: number;
  onSubmit: (q: string) => void;
}) {
  const { location, save } = useUserLocation();
  const [editing, setEditing] = useState(!q);
  const [text, setText] = useState(q);
  const [where, setWhere] = useState(location.label);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null } | null>(null);
  const [open, setOpen] = useState<"q" | "w" | null>(null);
  const [active, setActive] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const [gpsMsg, setGpsMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const listId = useId();
  const qRef = useRef<HTMLInputElement>(null);

  // O local salvo (cabeçalho, GPS ou servidor) aparece no campo quando muda.
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

  const term = useDeferredValue(text.trim());
  const sugg = useQuery({
    queryKey: queryKeys.autocomplete(term),
    queryFn: () => endpoints.autocomplete(term),
    enabled: editing && open === "q",
  });
  const placeTerm = useDeferredValue(where.trim());
  const places = useQuery({
    queryKey: queryKeys.places(placeTerm),
    queryFn: () => endpoints.placeAutocomplete(placeTerm),
    enabled: editing && open === "w" && placeTerm.length >= 2 && placeTerm !== location.label,
  });
  const placeRows = (places.data?.items ?? []).map((p) => p.label).slice(0, 5);

  const rows: Row[] = term
    ? (sugg.data?.items ?? []).map((s) => ({ text: s.text, hint: s.hint, kind: "sugg" }))
    : [
        ...history.map((t) => ({ text: t, kind: "hist" as const })),
        ...(sugg.data?.trending ?? []).map((t) => ({ text: t, kind: "trend" as const })),
      ];
  const firstTrend = rows.findIndex((r) => r.kind === "trend");

  const submit = (value: string) => {
    const t = value.trim();
    if (t) addToHistory(t);
    const w = where.trim();
    // Local digitado vira o local do usuário antes de buscar (Home e Explorar leem o mesmo local).
    if (w && coords) save.mutate({ label: w, lat: coords.lat, lng: coords.lng, radiusKm: location.radiusKm });
    else if (w && w !== location.label)
      save.mutate({ label: w, lat: null, lng: null, radiusKm: location.radiusKm });
    close();
    setText(t);
    if (t) setEditing(false);
    onSubmit(t);
  };

  const useGps = () => {
    if (!("geolocation" in navigator)) {
      setGpsMsg("Seu navegador não permite usar a localização.");
      return;
    }
    setGpsMsg("Buscando sua localização…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
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
      submit(rows[active].text);
    }
  };

  const cancel = () => {
    close();
    if (q) {
      setText(q);
      setEditing(false);
    } else setText("");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
      {editing ? (
        <form
          ref={formRef}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
          className="relative z-30 flex min-w-0 flex-1 basis-full flex-col gap-1 rounded-3xl border-2 border-primary bg-surface p-2 shadow-pop focus-within:ring-[3px] focus-within:ring-amber/60 lg:h-[72px] lg:basis-auto lg:flex-row lg:items-center lg:gap-4 lg:rounded-full lg:py-0 lg:pr-2 lg:pl-6"
        >
          <Search className="hidden size-5 shrink-0 text-navy-500 lg:block" aria-hidden />
          <div className="relative flex min-w-0 flex-col px-3 lg:flex-[1.4] lg:px-0">
            <label htmlFor="ex-q" className="text-[11px] leading-4 font-bold text-text-strong">
              O que você procura
            </label>
            <input
              ref={qRef}
              id="ex-q"
              type="search"
              value={text}
              autoComplete="off"
              autoFocus={!!q}
              role="combobox"
              aria-expanded={open === "q"}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              onChange={(e) => {
                setText(e.target.value.slice(0, 80));
                setOpen("q");
                setActive(-1);
              }}
              onFocus={() => {
                setHistory(readHistory().slice(0, HISTORY_SHOWN));
                setOpen("q");
              }}
              onKeyDown={onKeyDown}
              placeholder="Produto ou serviço. Ex.: tênis de corrida, cabeleireiro"
              className="min-w-0 bg-transparent text-base leading-6 text-text outline-none placeholder:text-navy-300 focus-visible:outline-none"
            />
            {open === "q" && (
              <div
                id={listId}
                role="listbox"
                aria-label="Sugestões"
                className={cn(panelCls, "left-0 lg:-left-11")}
                onMouseDown={(e) => e.preventDefault()}
              >
                {rows.map((r, i) => (
                  <div key={`${r.kind}-${r.text}`} role="presentation">
                    {i === 0 && r.kind === "hist" && (
                      <p className={cn(headCls, "flex items-center justify-between")}>
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
                      <p className={headCls}>{term ? "Sugestões" : "Buscas populares perto de você"}</p>
                    )}
                    <div className="flex items-center">
                      <button
                        type="button"
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={i === active}
                        onClick={() => submit(r.text)}
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
                            <TrendingUp className="size-5 text-text-2" aria-hidden />
                          ) : (
                            <Search className="size-5 text-text-2" aria-hidden />
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
                          <X className="size-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {rows.length === 0 && (
                  <p role="status" className="px-3 pb-2 text-[13px] text-text-subtle">
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
          </div>

          <span aria-hidden className="hidden h-10 w-px shrink-0 bg-surface-3 lg:block" />
          <MapPin className="hidden size-5 shrink-0 text-navy-500 lg:block" aria-hidden />

          <div className="relative flex min-w-0 flex-col border-t border-border px-3 pt-1 lg:flex-1 lg:border-t-0 lg:px-0 lg:pt-0">
            <label htmlFor="ex-w" className="text-[11px] leading-4 font-bold text-text-strong">
              Onde
            </label>
            <input
              id="ex-w"
              type="text"
              value={where}
              autoComplete="off"
              aria-haspopup="listbox"
              onChange={(e) => {
                setWhere(e.target.value.slice(0, 80));
                setCoords(null);
                setOpen("w");
              }}
              onFocus={(e) => {
                setGpsMsg("");
                setOpen("w");
                e.target.select();
              }}
              onKeyDown={(e) => e.key === "Escape" && close()}
              placeholder="Digite bairro ou cidade"
              className="min-w-0 bg-transparent pr-8 text-base leading-6 text-text outline-none placeholder:text-navy-300 focus-visible:outline-none"
            />
            {where.length > 0 && (
              <button
                type="button"
                aria-label="Limpar local"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setWhere("");
                  setCoords(null);
                  setOpen("w");
                }}
                className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full bg-surface-2 text-text-2 lg:top-4 lg:bottom-auto"
              >
                <X className="size-3.5" strokeWidth={2.5} aria-hidden />
              </button>
            )}
            {open === "w" && (
              <div
                role="listbox"
                aria-label="Locais"
                className={cn(panelCls, "left-0 lg:-left-11 lg:w-[420px]")}
                onMouseDown={(e) => e.preventDefault()}
              >
                {!placeTerm && (
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
                )}
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
                      <MapPin className="size-[22px] text-text" aria-hidden />
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
          </div>

          <div className="flex items-center justify-end gap-1 px-1 pb-1 lg:p-0">
            <button
              type="button"
              onClick={cancel}
              className="h-12 rounded-full px-3.5 text-[13px] font-semibold text-text-muted hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex h-[52px] items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-extrabold text-on-accent hover:bg-accent-hover"
            >
              <Search className="size-[18px]" strokeWidth={2.5} aria-hidden />
              Buscar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setText(q);
            setTimeout(() => qRef.current?.focus(), 30);
          }}
          aria-label="Editar busca"
          className="flex h-[52px] max-w-[560px] min-w-0 flex-[0_1_560px] items-center gap-3 rounded-full border border-border bg-surface pr-1.5 pl-[18px] text-left shadow-card hover:shadow-pop"
        >
          <Search className="size-5 shrink-0 text-navy-500" aria-hidden />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] leading-5 font-bold text-text-strong">{q}</span>
            <span className="truncate text-xs leading-4 text-text-muted">
              {location.label || "Local não definido"} · Até {radiusKm} km
            </span>
          </span>
          <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-[13px] font-bold whitespace-nowrap text-text-strong">
            <Pencil className="size-3.5" aria-hidden />
            Nova busca
          </span>
        </button>
      )}
      <DistanceButton radiusKm={radiusKm} tall={editing} />
    </div>
  );
}
