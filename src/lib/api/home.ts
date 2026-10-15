import { z } from "zod";

import { api } from "./client";
import { searchItemSchema } from "./search";

/** Contrato: docs/contratos/home.md */

export const HOME_SECTION_IDS = ["happening", "products", "services", "experiences"] as const;
export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export const homeItemSchema = searchItemSchema.extend({
  reason: z.object({ code: z.string(), label: z.string() }).nullable().optional(),
});
export type HomeItem = z.infer<typeof homeItemSchema>;

export const homeResponseSchema = z.object({
  sections: z.array(
    z.object({
      // ids desconhecidos são ignorados na tela: o servidor pode ganhar seções novas sem quebrar o front
      id: z.string(),
      items: z.array(homeItemSchema),
      total: z.number().int().nonnegative(),
    }),
  ),
  /** Quantos lugares com coordenadas existem no raio (chip do mapa). Ausente = o chip não aparece. */
  mapTotal: z.number().int().nonnegative().nullable().optional(),
});
export type HomeResponse = z.infer<typeof homeResponseSchema>;

type Where = { lat: number | null; lng: number | null; where: string; radiusKm: number };

const wherePart = (q: Where) => {
  const hasPoint = q.lat !== null && q.lng !== null;
  return {
    lat: hasPoint ? q.lat : undefined,
    lng: hasPoint ? q.lng : undefined,
    where: hasPoint ? undefined : q.where,
    radiusKm: q.radiusKm,
  };
};

export function fetchHome(q: Where) {
  return api("/discovery/home", homeResponseSchema, { query: wherePart(q) });
}

/** Quantos cards cabem por página em cada bloco (colunas do protótipo: 6 em "Acontecendo", 5 nos demais). */
export const SECTION_PAGE_SIZE: Record<HomeSectionId, number> = {
  happening: 6,
  products: 5,
  services: 5,
  experiences: 5,
};

/** Abas de cada bloco (textos fixos do protótipo). `all` é "Tudo" e usa a resposta principal da Home. */
export type HomeTab = { id: string; label: string };
export const HOME_TABS: Record<HomeSectionId, readonly HomeTab[]> = {
  happening: [
    { id: "all", label: "Tudo" },
    { id: "live", label: "Ao vivo" },
    { id: "video", label: "Vídeos" },
    { id: "offers", label: "Promoções e ofertas" },
    { id: "price", label: "Menor preço" },
  ],
  products: [
    { id: "all", label: "Tudo" },
    { id: "esporte", label: "Esporte" },
    { id: "moda", label: "Moda" },
    { id: "eletronicos", label: "Eletrônicos" },
    { id: "casa", label: "Casa e construção" },
  ],
  services: [
    { id: "all", label: "Tudo" },
    { id: "today", label: "Disponível hoje" },
    { id: "casa", label: "Casa e reparos" },
    { id: "beleza", label: "Beleza" },
    { id: "limpeza", label: "Limpeza" },
    { id: "auto", label: "Automotivo" },
  ],
  experiences: [
    { id: "all", label: "Tudo" },
    { id: "open", label: "Aberto agora" },
    { id: "comer", label: "Comer" },
    { id: "beber", label: "Beber" },
    { id: "passeios", label: "Passeios" },
    { id: "criancas", label: "Para crianças" },
    { id: "eventos", label: "Eventos" },
  ],
};

/** Uma página de um bloco, já filtrada pela aba. Mesmo formato de `GET /discovery/home`, com uma só seção. */
export async function fetchHomeSection(q: Where & { section: HomeSectionId; tab: string; page: number }) {
  const r = await api("/discovery/home", homeResponseSchema, {
    query: {
      ...wherePart(q),
      section: q.section,
      tab: q.tab,
      page: q.page,
      limit: SECTION_PAGE_SIZE[q.section],
    },
  });
  const s = r.sections.find((x) => x.id === q.section);
  return { items: s?.items ?? [], total: s?.total ?? 0 };
}
