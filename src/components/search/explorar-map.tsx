import { Crosshair, Map as MapIcon, Minus, Plus } from "lucide-react";

import { cn } from "@/components/ui/cn";

const PENDING = "Disponível quando o serviço de mapas estiver conectado";
const zbtn =
  "flex size-10 items-center justify-center bg-surface text-text-strong disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Mapa do Explorar (modos "Grade + mapa" e "Mapa"): mesma moldura do protótipo (área de 860 px, zoom, centralizar),
 * mas o mapa depende do serviço de mapas, ainda não escolhido (docs/PENDENCIAS.md). Os controles ficam
 * desabilitados com o motivo e nada aqui inventa coordenadas: só informa quantos resultados já trazem as reais.
 */
export function ExplorarMap({
  total,
  withCoords,
  className,
}: {
  total: number | null;
  withCoords: number | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-[360px] overflow-hidden rounded-2xl bg-surface-3 shadow-card lg:h-[860px]",
        className,
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
          <MapIcon className="size-6" aria-hidden />
        </span>
        <p role="status" className="font-semibold text-text-strong">
          Mapa ainda não conectado
        </p>
        <p className="max-w-xs text-sm text-text-muted">
          O serviço de mapas ainda não foi definido. Os marcadores aparecem aqui só com as coordenadas reais
          das lojas; enquanto isso, use a lista de resultados.
        </p>
      </div>
      <div
        role="group"
        aria-label="Zoom do mapa"
        className="absolute right-3 bottom-3 z-10 flex flex-col items-center gap-2"
      >
        <div className="flex flex-col divide-y divide-surface-3 overflow-hidden rounded-[10px] shadow-raised">
          <button type="button" disabled aria-label="Aproximar" title={PENDING} className={zbtn}>
            <Plus className="size-5" aria-hidden />
          </button>
          <button type="button" disabled aria-label="Afastar" title={PENDING} className={zbtn}>
            <Minus className="size-5" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          disabled
          aria-label="Centralizar em você"
          title={PENDING}
          className={cn(zbtn, "rounded-[10px] shadow-raised")}
        >
          <Crosshair className="size-[18px]" aria-hidden />
        </button>
      </div>
      <span className="absolute bottom-3 left-3 z-10 inline-flex h-[26px] items-center rounded-full bg-surface/90 px-2.5 text-[11px] font-bold text-text-muted shadow-card">
        Resultados com coordenadas:{" "}
        {total === null || withCoords === null ? "—" : `${withCoords} de ${total}`}
      </span>
    </div>
  );
}
