"use client";

import { ChevronDown, LocateFixed, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useDeferredValue, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { useDismiss } from "@/components/ui/use-dismiss";
import { useUserLocation } from "@/hooks/use-user-location";
import { endpoints, queryKeys } from "@/lib/api/endpoints";
import { RADIUS_STEPS, type RadiusKm } from "@/lib/domain/radius";

/** Outras telas pedem para abrir este painel disparando este evento na janela. */
export const OPEN_LOCATION_EVENT = "encontrae:abrir-local";

/** Botão "local · raio" do cabeçalho, com o painel para trocar bairro/cidade e a distância. */
export function LocationPicker() {
  const { location, save } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(location.label);
  const [radius, setRadius] = useState<RadiusKm>(location.radiusKm as RadiusKm);
  const [gpsMsg, setGpsMsg] = useState("");
  /** Coordenadas só existem quando vêm do GPS; texto digitado é convertido em ponto pelo back-end. */
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const inputId = useId();

  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const openPanel = useCallback(() => {
    setLabel(location.label);
    setCoords({ lat: location.lat, lng: location.lng });
    setRadius(location.radiusKm as RadiusKm);
    setGpsMsg("");
    setOpen(true);
  }, [location]);

  useEffect(() => {
    window.addEventListener(OPEN_LOCATION_EVENT, openPanel);
    return () => window.removeEventListener(OPEN_LOCATION_EVENT, openPanel);
  }, [openPanel]);

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
        setLabel("Minha localização atual");
        setGpsMsg("");
      },
      () => setGpsMsg("Não foi possível pegar sua localização. Digite o bairro ou a cidade."),
      { timeout: 8000 },
    );
  };

  const term = useDeferredValue(label.trim());
  const places = useQuery({
    queryKey: queryKeys.places(term),
    queryFn: () => endpoints.placeAutocomplete(term),
    enabled: open && term.length >= 2 && term !== location.label,
  });
  const matches = (places.data?.items ?? [])
    .map((p) => p.label)
    .filter((p) => p !== label)
    .slice(0, 4);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = label.trim();
    if (!text) return;
    save.mutate({ label: text, lat: coords.lat, lng: coords.lng, radiusKm: radius }, { onSuccess: close });
  };

  return (
    <div ref={ref} className="relative min-w-0 md:shrink-0">
      <button
        type="button"
        onClick={() => (open ? close() : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-10 max-w-[44vw] min-w-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-white hover:bg-white/10 md:max-w-[16rem] lg:rounded-l-none lg:border-l lg:border-header-border lg:px-4"
      >
        <MapPin className="size-4 shrink-0 text-amber-400" aria-hidden />
        <span className="sr-only">Localização: </span>
        <span className="truncate">{location.label || "Definir local"}</span>
        <span className="hidden shrink-0 whitespace-nowrap text-navy-200 sm:inline">
          · {location.radiusKm} km
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-navy-200" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-labelledby={titleId}
          className="fixed inset-x-4 top-20 z-50 rounded-2xl border border-border bg-surface p-5 text-text shadow-pop sm:absolute sm:inset-x-auto sm:top-12 sm:left-0 sm:w-96"
        >
          <form onSubmit={submit} className="flex flex-col gap-4">
            <h2 id={titleId} className="text-lg font-bold text-text-strong">
              Sua localização
            </h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={inputId} className="text-xs font-bold text-text-strong">
                Bairro ou cidade
              </label>
              <input
                id={inputId}
                autoFocus
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value.slice(0, 80));
                  setCoords({ lat: null, lng: null });
                }}
                placeholder="Ex.: Ponta Verde, Maceió"
                autoComplete="off"
                className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-base text-text outline-none placeholder:text-text-subtle focus:border-primary"
              />
              {matches.length > 0 && (
                <ul className="flex flex-col" aria-label="Sugestões de local">
                  {matches.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        onClick={() => {
                          setLabel(p);
                          setCoords({ lat: null, lng: null });
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-text-2 hover:bg-surface-2"
                      >
                        <MapPin className="size-4 text-text-subtle" aria-hidden />
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {places.isError && (
                <p role="status" className="text-xs text-text-muted">
                  Não foi possível buscar sugestões de local agora. Você ainda pode digitar o bairro ou a
                  cidade.
                </p>
              )}
              <button
                type="button"
                onClick={useGps}
                className="flex h-10 items-center gap-2 self-start rounded-lg px-1 text-sm font-semibold text-link hover:underline"
              >
                <LocateFixed className="size-4" aria-hidden />
                Usar minha localização
              </button>
              {gpsMsg && (
                <p role="status" className="text-sm text-text-muted">
                  {gpsMsg}
                </p>
              )}
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-xs font-bold text-text-strong">Distância</legend>
              <div className="flex flex-wrap gap-2">
                {RADIUS_STEPS.map((km) => {
                  const on = km === radius;
                  return (
                    <button
                      key={km}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setRadius(km)}
                      className={cn(
                        "h-10 min-w-14 rounded-full border px-3 text-sm font-semibold",
                        on
                          ? "border-primary bg-primary text-on-primary"
                          : "border-border bg-surface text-text-2 hover:border-navy-300",
                      )}
                    >
                      {km} km
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {save.isError && (
              <p role="alert" className="text-sm text-danger-text">
                Não foi possível salvar. Tente de novo.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="h-11 rounded-lg px-4 text-sm font-semibold text-text-2 hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!label.trim() || save.isPending}
                className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                {save.isPending ? "Salvando…" : "Aplicar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
