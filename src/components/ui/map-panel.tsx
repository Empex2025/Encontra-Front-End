import { Map as MapIcon, Minus, Plus } from "lucide-react";

import { cn } from "./cn";

/** Legenda dos marcadores: cores por papel de token, a mesma lógica dos cards (loja, prestador, oferta, ao vivo). */
const LEGEND = [
  { label: "Loja", dot: "bg-primary" },
  { label: "Prestador de serviço", dot: "bg-link" },
  { label: "Oferta", dot: "bg-accent" },
  { label: "Ao vivo", dot: "bg-danger" },
] as const;

const PENDING = "Disponível quando o serviço de mapas estiver conectado";

/**
 * Painel do mapa. A estrutura (área, controles, legenda) fica sempre visível; o mapa em si depende do serviço de
 * mapas, que ainda não foi escolhido (docs/PENDENCIAS.md). Nada aqui inventa coordenadas: só informa quantos
 * resultados reais já trazem coordenadas do servidor.
 */
export function MapPanel({
  total,
  withCoords,
  className,
}: {
  /** Resultados carregados na tela; `null` quando ainda não há dados (carregando, erro ou sem local). */
  total: number | null;
  /** Quantos desses resultados trazem latitude e longitude. */
  withCoords: number | null;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-surface", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <p className="text-sm font-bold text-text-strong">Mapa dos resultados</p>
        <div className="flex gap-1.5" role="group" aria-label="Zoom do mapa">
          <button
            type="button"
            disabled
            aria-label="Aproximar o mapa"
            title={PENDING}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-text-subtle disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            disabled
            aria-label="Afastar o mapa"
            title={PENDING}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-text-subtle disabled:opacity-50"
          >
            <Minus className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-2 bg-surface-2 px-5 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
          <MapIcon className="size-6" aria-hidden />
        </span>
        <p role="status" className="font-semibold text-text-strong">
          Mapa ainda não conectado
        </p>
        <p className="max-w-md text-sm text-text-muted">
          O serviço de mapas ainda não foi definido. Os marcadores aparecem aqui só com as coordenadas reais
          das lojas; enquanto isso, use a grade ou a lista de resultados.
        </p>
        <p className="text-xs text-text-subtle">
          Resultados com coordenadas:{" "}
          {total === null || withCoords === null ? "—" : `${withCoords} de ${total}`}
        </p>
      </div>

      <ul
        aria-label="Legenda do mapa"
        className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border px-4 py-2.5"
      >
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5 text-xs text-text-muted">
            <span aria-hidden className={cn("size-2.5 rounded-full", l.dot)} />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
