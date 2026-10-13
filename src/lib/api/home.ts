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
});
export type HomeResponse = z.infer<typeof homeResponseSchema>;

export function fetchHome(q: { lat: number | null; lng: number | null; where: string; radiusKm: number }) {
  const hasPoint = q.lat !== null && q.lng !== null;
  return api("/discovery/home", homeResponseSchema, {
    query: {
      lat: hasPoint ? q.lat : undefined,
      lng: hasPoint ? q.lng : undefined,
      where: hasPoint ? undefined : q.where,
      radiusKm: q.radiusKm,
    },
  });
}
