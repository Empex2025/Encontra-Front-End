import type { Lens } from "@/lib/api/search";

import { CATEGORIES } from "./categories";

export const LENS_LABEL: Record<Lens, string> = {
  live: "Ao vivo",
  offers: "Ofertas",
  price: "Menor preço",
  new: "Novidades",
  trending: "Em alta",
  open: "Aberto agora",
};

export const LENS_SUFFIX: Record<Lens, string> = {
  live: " ao vivo",
  offers: " em oferta",
  price: " com preço",
  new: " novos",
  trending: " em alta",
  open: " abertos agora",
};

export type ResultsStatus = "loading" | "error" | "ready" | "no-place";

/**
 * Título da lista de resultados do Explorar. Erro e carregamento nunca viram "0 resultados":
 * zero só aparece quando o servidor respondeu e não há nada.
 */
export function resultsHeading({
  q,
  cat,
  lens,
  status,
  total,
}: {
  q: string;
  cat?: string;
  lens?: Lens;
  status: ResultsStatus;
  total: number;
}): string {
  const isSearch = q.length > 0;
  if (status === "no-place") return isSearch ? `Busca por “${q}”` : "O que tem perto de você";
  if (status === "loading") return isSearch ? `Buscando “${q}”…` : "Carregando…";
  if (status === "error") return isSearch ? `Não foi possível buscar “${q}”` : "Não foi possível carregar";
  const catName = cat ? CATEGORIES.find((c) => c.id === cat)?.name : undefined;
  if (!isSearch) {
    const base = catName ?? (lens ? LENS_LABEL[lens] : "O que tem perto de você");
    if (catName && lens) return `${catName} · ${LENS_LABEL[lens].toLowerCase()} perto de você`;
    return catName || lens ? `${base} perto de você` : base;
  }
  return `${total} ${total === 1 ? "resultado" : "resultados"}${lens ? LENS_SUFFIX[lens] : ""} para “${q}”${catName ? ` em ${catName}` : ""}`;
}

/** Quantos itens trazem coordenadas reais (o mapa só pode marcar esses; nada é inventado). */
export function countWithCoords(items: { lat: number | null; lng: number | null }[]): number {
  return items.filter((i) => i.lat !== null && i.lng !== null).length;
}
