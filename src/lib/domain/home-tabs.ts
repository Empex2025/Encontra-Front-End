import type { HomeSectionId } from "@/lib/api/home";

import { explorarHref } from "./search-state";

/** Para onde leva "Ver todos": o Explorar já com o filtro mais próximo da aba escolhida. */
export function seeAllHref(id: HomeSectionId, tab: string) {
  const base = { q: "", specialty: [] as string[], sort: "relevance" as const };
  if (id === "happening") {
    const lens = tab === "live" ? "live" : tab === "price" ? "price" : "offers";
    return explorarHref({ ...base, lens });
  }
  if (id === "products") return explorarHref({ ...base, cat: tab === "all" ? undefined : tab });
  if (id === "services") {
    const cat = tab === "all" || tab === "today" ? "servicos" : tab === "limpeza" ? "servicos" : tab;
    return explorarHref({ ...base, cat, lens: tab === "today" ? "open" : undefined });
  }
  const cat = tab === "comer" ? "comida" : "bares";
  return explorarHref({ ...base, cat, lens: tab === "open" ? "open" : undefined });
}

/** Contador e setas de um bloco: "1–5 de 12", com as pontas desligadas. */
export function pageRange(page: number, size: number, shown: number, total: number) {
  const first = (page - 1) * size + 1;
  return {
    first,
    last: Math.min(total, first - 1 + shown),
    hasPrev: page > 1,
    hasNext: page * size < total,
  };
}
