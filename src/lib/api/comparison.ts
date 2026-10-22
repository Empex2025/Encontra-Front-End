import { z } from "zod";

import { api } from "./client";
import { searchItemSchema, searchResponseSchema } from "./search";

/** Contrato: docs/contratos/comparar.md */

export const CRITERION_KINDS = ["money", "distance", "rating", "number", "boolean", "text"] as const;

export const criterionSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(CRITERION_KINDS),
  better: z.enum(["lower", "higher"]).nullable(),
  priority: z.object({ badge: z.string() }).nullable(),
});
export type Criterion = z.infer<typeof criterionSchema>;

export const cellSchema = z.object({
  text: z.string().nullable(),
  detail: z.string().nullable(),
  value: z.union([z.number(), z.boolean()]).nullable(),
});
export type Cell = z.infer<typeof cellSchema>;

export const comparedItemSchema = z.object({
  ref: z.string(),
  type: z.enum(["product", "service"]),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  imageUrl: z.string().nullable(),
  profile: z
    .object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      kind: z.enum(["store", "provider"]),
      verified: z.boolean(),
    })
    .nullable(),
  cells: z.record(cellSchema),
  /** Cartão completo do item (mesmo formato de `GET /search`) para o quadro mostrar foto, preço, nota e loja. */
  card: searchItemSchema.nullable().optional(),
});
export type ComparedItem = z.infer<typeof comparedItemSchema>;

export const comparisonViewSchema = z.object({
  group: z.object({ id: z.string(), label: z.string(), kind: z.enum(["product", "service"]) }),
  criteria: z.array(criterionSchema),
  items: z.array(comparedItemSchema),
  missing: z.array(z.string()),
});
export type ComparisonView = z.infer<typeof comparisonViewSchema>;

export function fetchComparison(refs: readonly string[], point: { lat: number | null; lng: number | null }) {
  return api("/comparisons/view", comparisonViewSchema, {
    query: {
      items: refs.join(","),
      lat: point.lat ?? undefined,
      lng: point.lng ?? undefined,
    },
  });
}

/* ---------- Pesquisa da tela Comparar (docs/contratos/comparar.md › Pesquisa para comparar) ---------- */

export const COMPARE_SORTS = ["relevance", "distance", "price", "price_desc", "rating", "reviews"] as const;
export type CompareSort = (typeof COMPARE_SORTS)[number];

const compareSearchSchema = searchResponseSchema.extend({
  /** Termos parecidos com a busca ("tênis casual"), para a fileira "Relacionados à sua busca". */
  related: z.array(z.string()).default([]),
});
export type CompareSearchResponse = z.infer<typeof compareSearchSchema>;

export type CompareSearchQuery = {
  q: string;
  sort: CompareSort;
  radiusKm: number;
  lat: number | null;
  lng: number | null;
  where: string;
  /** Produtos: só com desconto / só lojas abertas. Serviços: só em domicílio / só verificados. */
  hasDiscount: boolean;
  openNow: boolean;
  homeService: boolean;
  verifiedOnly: boolean;
};

export const COMPARE_PAGE_SIZE = 12;

export function fetchCompareSearch(query: CompareSearchQuery, page: number) {
  const hasPoint = query.lat !== null && query.lng !== null;
  return api("/search", compareSearchSchema, {
    query: {
      q: query.q,
      comparable: 1,
      sort: query.sort,
      lat: hasPoint ? query.lat : undefined,
      lng: hasPoint ? query.lng : undefined,
      where: hasPoint ? undefined : query.where,
      radiusKm: query.radiusKm,
      hasDiscount: query.hasDiscount ? 1 : undefined,
      openNow: query.openNow ? 1 : undefined,
      serviceMode: query.homeService ? "home" : undefined,
      verified: query.verifiedOnly ? 1 : undefined,
      page,
      limit: COMPARE_PAGE_SIZE,
    },
  });
}
