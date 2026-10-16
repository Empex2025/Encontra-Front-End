import { z } from "zod";

import { CATEGORY_IDS } from "@/lib/domain/categories";

import { api } from "./client";

/** Contrato: docs/contratos/busca.md */

export const LENSES = ["live", "offers", "price", "new", "trending", "open"] as const;
export type Lens = (typeof LENSES)[number];
export const KINDS = ["product", "service", "place"] as const;
export type Kind = (typeof KINDS)[number];
export const SORTS = ["relevance", "distance", "price", "rating"] as const;
export type Sort = (typeof SORTS)[number];
export type ServiceMode = "local" | "home";

const categoryId = z.enum(CATEGORY_IDS);

export const searchItemSchema = z.object({
  id: z.string(),
  type: z.enum(KINDS),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  profile: z
    .object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      kind: z.enum(["store", "provider"]),
      verified: z.boolean(),
      /** Foto do perfil; sem ela o card mostra as iniciais. */
      avatarUrl: z.string().nullable().optional(),
    })
    .nullable(),
  categoryId: categoryId.nullable(),
  /** Grupo comparável (mais fino que a categoria). Contrato: docs/contratos/comparar.md */
  group: z.object({ id: z.string(), label: z.string() }).nullable().optional(),
  imageUrl: z.string().nullable(),
  distanceKm: z.number().nonnegative().nullable(),
  neighborhood: z.string().nullable(),
  rating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative(),
  price: z
    .object({
      amountCents: z.number().int().nonnegative(),
      oldAmountCents: z.number().int().nonnegative().nullable(),
      unit: z.string().nullable(),
      updatedAt: z.string().nullable(),
    })
    .nullable(),
  offerText: z.string().nullable(),
  isNew: z.boolean(),
  trending: z.boolean(),
  sponsored: z.boolean(),
  homeService: z.boolean(),
  live: z.object({ id: z.string(), viewers: z.number().int().nonnegative() }).nullable(),
  status: z.enum(["open", "soon", "closed"]).nullable(),
  availability: z.enum(["in_stock", "out_of_stock", "unknown"]).optional(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /* Campos opcionais dos cards (protótipo). Ausente = o card não mostra a informação. Contrato: docs/contratos/home.md */
  viewCount: z.number().int().nonnegative().nullable().optional(),
  soldCount: z.number().int().nonnegative().nullable().optional(),
  doneCount: z.number().int().nonnegative().nullable().optional(),
  specialties: z.array(z.string()).optional(),
  /** Detalhe de onde o serviço atende (ex.: "até 8 km" em domicílio, "Salão próprio" no local). */
  serviceNote: z.string().nullable().optional(),
  /** Quando é, para eventos e experiências (ex.: "Hoje, 20h"). */
  scheduleLabel: z.string().nullable().optional(),
  favorited: z.boolean().optional(),
});
export type SearchItem = z.infer<typeof searchItemSchema>;

const counts = z.record(z.number().int().nonnegative());

export const searchResponseSchema = z.object({
  items: z.array(searchItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  facets: z.object({
    categories: counts,
    lenses: counts,
    kinds: counts.optional(),
    serviceMode: counts.optional(),
    specialties: z
      .array(z.object({ id: z.string(), label: z.string(), count: z.number().int().nonnegative() }))
      .optional(),
    minRating: counts.optional(),
  }),
  widen: z.object({ nextRadiusKm: z.number(), gain: z.number().int().nonnegative() }).nullable(),
  nearestOutside: z
    .object({ name: z.string(), distanceKm: z.number(), neighborhood: z.string().nullable() })
    .nullable(),
  similar: z.array(searchItemSchema),
});
export type SearchResponse = z.infer<typeof searchResponseSchema>;

export type SearchQuery = {
  q: string;
  cat?: string;
  lens?: Lens;
  kind?: Kind;
  serviceMode?: ServiceMode;
  specialty: string[];
  minRating?: number;
  sort: Sort;
  radiusKm: number;
  lat: number | null;
  lng: number | null;
  where: string;
};

export const PAGE_SIZE = 12;

export function fetchSearch(query: SearchQuery, page: number) {
  const hasPoint = query.lat !== null && query.lng !== null;
  const common = {
    lat: hasPoint ? query.lat : undefined,
    lng: hasPoint ? query.lng : undefined,
    where: hasPoint ? undefined : query.where,
    radiusKm: query.radiusKm,
    cat: query.cat,
    page,
    limit: PAGE_SIZE,
  };
  if (!query.q)
    return api("/discovery/nearby", searchResponseSchema, { query: { ...common, lens: query.lens } });
  return api("/search", searchResponseSchema, {
    query: {
      ...common,
      q: query.q,
      lens: query.lens,
      kind: query.kind,
      serviceMode: query.serviceMode,
      specialty: query.specialty,
      minRating: query.minRating,
      sort: query.sort,
    },
  });
}

/** Pedido "Quero em promoção" (Documento de entrega › Explorar, regras 23–25). */
export const wantSchema = z.object({
  id: z.string(),
  term: z.string(),
  radiusKm: z.number(),
  deadline: z.enum(["today", "week", "month"]),
  maxPriceCents: z.number().int().nullable(),
  people: z.number().int().nonnegative(),
  profilesNotified: z.number().int().nonnegative(),
  status: z.enum(["waiting", "found", "expired"]),
});
export type Want = z.infer<typeof wantSchema>;

export function createWant(body: {
  term: string;
  radiusKm: number;
  deadline: Want["deadline"];
  maxPriceCents: number | null;
}) {
  return api("/me/wants", wantSchema, { method: "POST", body });
}

/**
 * "Perguntar às lojas perto" (Explorar, busca sem resultado). Contrato proposto em docs/contratos/busca.md:
 * o servidor envia “alguém faz {term}?” às lojas e prestadores do ramo no raio e abre as conversas.
 */
export const askStoresSchema = z.object({ profilesNotified: z.number().int().nonnegative() });
export type AskStoresResult = z.infer<typeof askStoresSchema>;

export function askStores(body: {
  term: string;
  radiusKm: number;
  lat: number | null;
  lng: number | null;
  where: string;
}) {
  const hasPoint = body.lat !== null && body.lng !== null;
  return api("/search/asks", askStoresSchema, {
    method: "POST",
    body: {
      term: body.term,
      radiusKm: body.radiusKm,
      lat: hasPoint ? body.lat : undefined,
      lng: hasPoint ? body.lng : undefined,
      where: hasPoint ? undefined : body.where,
    },
  });
}
