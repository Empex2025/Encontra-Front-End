import { Map as MapIcon } from "lucide-react";

/** Espaço do mapa de resultados. O mapa real depende da escolha do serviço de mapas e de `GET /map` (docs/PENDENCIAS.md). */
export function HomeMap() {
  return (
    <section aria-labelledby="home-mapa" className="flex flex-col gap-3">
      <div>
        <h2 id="home-mapa" className="text-xl font-bold text-text-strong">
          Mapa
        </h2>
        <p className="text-sm text-text-muted">Lojas, ofertas e serviços perto de você</p>
      </div>
      <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong bg-surface-2 px-5 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
          <MapIcon className="size-6" aria-hidden />
        </span>
        <p className="font-semibold text-text-strong">
          O mapa entra assim que o serviço de mapas for definido
        </p>
        <p className="max-w-md text-sm text-text-muted">
          Os marcadores só aparecem com coordenadas reais das lojas; nada é inventado.
        </p>
      </div>
    </section>
  );
}
