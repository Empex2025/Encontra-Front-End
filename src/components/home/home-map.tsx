"use client";

import { Map as MapIcon, Maximize2, Minus, Plus } from "lucide-react";
import Link from "next/link";

import { useHomeData } from "@/hooks/use-home";
import { routes } from "@/lib/routes";

const PENDING = "Disponível quando o serviço de mapas estiver conectado";

const ctrl = "flex size-10 items-center justify-center text-text-strong shadow-raised disabled:opacity-60";

/**
 * Mapa de Resultados da Home, logo depois das categorias (protótipo). O mapa real depende da escolha do serviço de
 * mapas e de `GET /map` (docs/PENDENCIAS.md): enquanto isso, a área mantém título, chip, link e controles, e
 * nada é marcado sem coordenadas reais. O chip só aparece com o total que o servidor informar (`mapTotal`).
 */
export function HomeMap() {
  const { query } = useHomeData();
  const total = query.data?.mapTotal ?? null;

  return (
    <section
      aria-labelledby="home-mapa"
      className="flex min-h-[338px] flex-col overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3">
        <h2 id="home-mapa" className="text-sm leading-5 font-bold text-text-strong">
          Mapa de Resultados
        </h2>
        {total !== null && total > 0 && (
          <span className="rounded-full bg-accent-soft px-2 py-1 text-xs leading-4 font-bold text-accent-text">
            Todos · {total} {total === 1 ? "local perto" : "locais perto"} de você
          </span>
        )}
        <Link
          href={routes.explorar}
          className="ml-auto text-[13px] leading-5 font-bold text-link hover:underline"
        >
          Abrir mapa completo ›
        </Link>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-2 bg-surface-2 px-5 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
          <MapIcon className="size-6" aria-hidden />
        </span>
        <p role="status" className="font-semibold text-text-strong">
          O mapa aparece aqui quando o serviço de mapas for conectado
        </p>
        <p className="max-w-md text-sm text-text-muted">
          Os marcadores só mostram lojas com localização real. Enquanto isso, veja tudo o que está perto de
          você na lista do Explorar.
        </p>
        <div
          className="absolute top-3 right-3 flex flex-col gap-2"
          role="group"
          aria-label="Controles do mapa"
        >
          <button
            type="button"
            disabled
            title={PENDING}
            aria-label="Expandir mapa"
            className={`${ctrl} rounded-full bg-surface`}
          >
            <Maximize2 className="size-4" aria-hidden />
          </button>
          <div className="flex flex-col overflow-hidden rounded-full bg-surface shadow-raised">
            <button
              type="button"
              disabled
              title={PENDING}
              aria-label="Aproximar"
              className={ctrl.replace("shadow-raised", "")}
            >
              <Plus className="size-5" aria-hidden />
            </button>
            <span aria-hidden className="mx-2 h-px bg-surface-3" />
            <button
              type="button"
              disabled
              title={PENDING}
              aria-label="Afastar"
              className={ctrl.replace("shadow-raised", "")}
            >
              <Minus className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
