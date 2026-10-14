import { MapPanel } from "@/components/ui/map-panel";

/**
 * Mapa de resultados da Home. A estrutura (título, área, controles e legenda) fica visível; o mapa real depende da
 * escolha do serviço de mapas e de `GET /map` (docs/PENDENCIAS.md). Nada é marcado sem coordenadas reais.
 */
export function HomeMap() {
  return (
    <section aria-labelledby="home-mapa" className="flex flex-col gap-3">
      <div>
        <h2 id="home-mapa" className="text-xl font-bold text-text-strong">
          Mapa
        </h2>
        <p className="text-sm text-text-muted">Lojas, ofertas e serviços perto de você</p>
      </div>
      <MapPanel total={null} withCoords={null} />
    </section>
  );
}
