import { z } from "zod";

import { api } from "./client";

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
