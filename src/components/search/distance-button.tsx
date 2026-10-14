"use client";

import { ChevronDown, Ruler } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { useDismiss } from "@/components/ui/use-dismiss";
import { useUserLocation } from "@/hooks/use-user-location";
import { RADIUS_STEPS, type RadiusKm } from "@/lib/domain/radius";

/** "Distância" do Explorar: escolher o raio grava a preferência do usuário (regra 12). */
export function DistanceButton({ radiusKm, compact }: { radiusKm: number; compact: boolean }) {
  const { location, save } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [tmp, setTmp] = useState<RadiusKm>(radiusKm as RadiusKm);
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setTmp(radiusKm as RadiusKm);
          setOpen((o) => !o);
        }}
        className={cn(
          "flex items-center gap-2.5 rounded-full border border-border bg-surface pr-4 pl-4 text-left shadow-card hover:shadow-raised",
          compact ? "h-[52px]" : "h-14",
        )}
      >
        <Ruler className="size-5 text-text-subtle" aria-hidden />
        <span className="flex flex-col">
          <span className="text-[11px] leading-4 font-bold text-text-strong">Distância</span>
          <span className="text-[15px] leading-5 whitespace-nowrap text-text">Até {radiusKm} km</span>
        </span>
        <ChevronDown className="size-3.5 text-text-subtle" aria-hidden />
      </button>
      {open && (
        <div
          role="dialog"
          aria-labelledby={titleId}
          className="absolute top-full right-0 z-40 mt-2 w-[min(92vw,360px)] rounded-2xl border border-border bg-surface p-5 shadow-pop"
        >
          <h2 id={titleId} className="text-lg font-bold text-text-strong">
            Até onde você quer ir?
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            A partir de <b className="text-text">{location.label || "seu local"}</b>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {RADIUS_STEPS.map((km) => (
              <button
                key={km}
                type="button"
                aria-pressed={tmp === km}
                onClick={() => setTmp(km)}
                className={cn(
                  "h-10 min-w-14 rounded-full border px-3 text-sm font-semibold",
                  tmp === km
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border text-text-2 hover:border-navy-300",
                )}
              >
                {km} km
              </button>
            ))}
          </div>
          {save.isError && (
            <p role="alert" className="mt-3 text-sm text-danger-text">
              Não foi possível salvar. Tente de novo.
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="h-11 rounded-lg px-4 text-sm font-semibold text-text-2 hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate({ ...location, radiusKm: tmp }, { onSuccess: close })}
              className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              Mostrar resultados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
