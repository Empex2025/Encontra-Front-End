import { MapPanel } from "@/components/ui/map-panel";
import { routes } from "@/lib/routes";

/**
 * Mapa de resultados da Home, logo abaixo das categorias (como no protótipo). A estrutura fica visível; o mapa
 * real depende da escolha do serviço de mapas e de `GET /map` (docs/PENDENCIAS.md). Nada é marcado sem
 * coordenadas reais.
 */
export function HomeMap() {
  return <MapPanel title="Mapa de Resultados" total={null} withCoords={null} href={routes.explorar} />;
}
