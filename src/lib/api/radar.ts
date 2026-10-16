import { z } from "zod";

import { api } from "./client";

/** Contrato: docs/contratos/radar.md */

export const RADAR_KINDS = ["new", "price", "follow", "alert"] as const;
export type RadarKind = (typeof RADAR_KINDS)[number];

const count = z.number().int().nonnegative();

export const radarItemSchema = z.object({
  id: z.string(),
  // tipo desconhecido é descartado na tela: o servidor pode ganhar tipos novos sem quebrar o front
  kind: z.string(),
  title: z.string(),
  detail: z.string().nullable().optional(),
  at: z.string(),
  seen: z.boolean(),
  href: z.string().nullable().optional(),
});
export type RadarItem = z.infer<typeof radarItemSchema>;

export const radarSchema = z.object({
  items: z.array(radarItemSchema),
  unseen: count,
  counts: z.object({ all: count, new: count, price: count, follow: count, alert: count }),
  tracking: z
    .object({ follows: count, alerts: count, interests: z.array(z.string()) })
    .nullable()
    .optional(),
});
export type Radar = z.infer<typeof radarSchema>;

export const trendingSchema = z.object({
  area: z.string().nullable().optional(),
  searches: z.array(
    z.object({ term: z.string(), searches: count, growthPct: z.number().nullable().optional() }),
  ),
  places: z.array(
    z.object({
      profile: z.object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        kind: z.enum(["store", "provider"]),
      }),
      signal: z.string(),
      branch: z.string().nullable().optional(),
      distanceKm: z.number().nonnegative().nullable().optional(),
    }),
  ),
});
export type Trending = z.infer<typeof trendingSchema>;

export const pricesSchema = z.object({
  items: z.array(
    z.object({
      item: z.string(),
      valueCents: z.number().int().nonnegative(),
      basis: z.string().min(1),
      changePct: z.number().nullable().optional(),
      period: z.string().nullable().optional(),
      direction: z.enum(["up", "down", "flat"]),
      href: z.string().nullable().optional(),
      /** Preços recentes (do mais antigo ao mais novo) para o minigráfico; sem série, o gráfico não aparece. */
      series: z.array(z.number().nonnegative()).min(2).nullable().optional(),
    }),
  ),
  /** Faixa de destaque do bloco (ex.: "A gasolina caiu 3,2% perto de você esta semana"). Só se vier do servidor. */
  headline: z
    .object({
      title: z.string(),
      detail: z.string().nullable().optional(),
      direction: z.enum(["up", "down"]),
      href: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type Prices = z.infer<typeof pricesSchema>;

type Area = { lat: number | null; lng: number | null; radiusKm: number };
const areaQuery = (a: Area) => ({
  lat: a.lat !== null && a.lng !== null ? a.lat : undefined,
  lng: a.lat !== null && a.lng !== null ? a.lng : undefined,
  radiusKm: a.radiusKm,
});

export const radar = {
  mine: () => api("/me/radar", radarSchema),
  markSeen: (ids: string[]) => api("/me/radar/seen", z.undefined(), { method: "POST", body: { ids } }),
  trending: (a: Area) => api("/discovery/trending", trendingSchema, { query: areaQuery(a) }),
  prices: (a: Area) => api("/discovery/prices", pricesSchema, { query: areaQuery(a) }),
};
