"use client";

import { ChevronDown, Ruler, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { useUserLocation } from "@/hooks/use-user-location";
import { RADIUS_STEPS, type RadiusKm } from "@/lib/domain/radius";

/**
 * "Distância" do Explorar (protótipo): botão em pílula e janela "Até onde você quer ir?" com o valor grande,
 * barra e atalhos. A escala é a única do produto (1, 3, 5, 10, 20 e 50 km), por isso a barra anda por degraus
 * e não há campo livre. Escolher grava a preferência do usuário (regra 12).
 */
export function DistanceButton({ radiusKm, tall }: { radiusKm: number; tall: boolean }) {
  const { location, save } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [tmp, setTmp] = useState<RadiusKm>(radiusKm as RadiusKm);
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const idx = Math.max(0, RADIUS_STEPS.indexOf(tmp));

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Distância: até ${radiusKm} km. Alterar`}
        onClick={() => {
          setTmp(radiusKm as RadiusKm);
          setOpen(true);
        }}
        className={cn(
          "flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-surface pr-[18px] pl-4 text-left shadow-raised hover:shadow-pop",
          tall ? "h-[72px]" : "h-[52px]",
        )}
      >
        <Ruler className="size-5 shrink-0 text-navy-500" aria-hidden />
        <span className="flex flex-col">
          <span className="text-[11px] leading-4 font-bold text-text-strong">Distância</span>
          <span className="text-[15px] leading-[22px] whitespace-nowrap text-text">Até {radiusKm} km</span>
        </span>
        <ChevronDown className="size-3.5 text-text-muted" aria-hidden />
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && setOpen(false)}
        className="m-auto w-[min(94vw,520px)] rounded-2xl border-0 bg-surface p-0 text-text shadow-pop backdrop:bg-primary/45"
      >
        <div className="flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="text-xl leading-7 font-bold text-text-strong">
                Até onde você quer ir?
              </h2>
              <span className="text-sm leading-5 text-text-muted">
                A partir de <b className="text-text">{location.label || "seu local"}</b>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-2"
            >
              <X className="size-[18px]" aria-hidden />
            </button>
          </div>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-5xl leading-[56px] font-extrabold text-text-strong">{tmp}</span>
            <span className="text-lg font-bold text-text-muted">km</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              type="range"
              min={0}
              max={RADIUS_STEPS.length - 1}
              step={1}
              value={idx}
              onChange={(e) => setTmp(RADIUS_STEPS[Number(e.target.value)])}
              aria-label="Distância em km"
              aria-valuetext={`${tmp} km`}
              className="w-full accent-[var(--primary)]"
            />
            <div className="flex justify-between text-xs text-text-subtle">
              <span>{RADIUS_STEPS[0]} km</span>
              <span>{RADIUS_STEPS[Math.floor(RADIUS_STEPS.length / 2)]} km</span>
              <span>{RADIUS_STEPS[RADIUS_STEPS.length - 1]} km</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {RADIUS_STEPS.map((km) => (
              <button
                key={km}
                type="button"
                aria-pressed={tmp === km}
                onClick={() => setTmp(km)}
                className={cn(
                  "h-11 rounded-full border px-3.5 text-[13px] font-semibold",
                  tmp === km
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface text-text-2 hover:border-navy-300",
                )}
              >
                {km} km
              </button>
            ))}
          </div>
          {save.isError && (
            <p role="alert" className="text-sm text-danger-text">
              Não foi possível salvar. Tente de novo.
            </p>
          )}
          <div className="flex justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 rounded-lg border-[1.5px] border-primary bg-surface px-5 text-sm font-semibold text-text-strong"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate({ ...location, radiusKm: tmp }, { onSuccess: () => setOpen(false) })}
              className="h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              Mostrar resultados
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
