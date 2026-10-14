import { z } from "zod";

import { couponSchema, profileSummarySchema } from "./catalog";
import { api } from "./client";
import { searchItemSchema } from "./search";

/** Contrato: docs/contratos/oferta.md */
const nstr = z.string().nullable();

export const offerPageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: nstr,
  imageUrl: nstr,
  status: z.enum(["active", "ended"]),
  endsAt: nstr,
  profile: profileSummarySchema
    .pick({
      id: true,
      slug: true,
      kind: true,
      name: true,
      avatarUrl: true,
      whatsapp: true,
      status: true,
    })
    .extend({ verification: profileSummarySchema.shape.verification.optional() }),
  product: z
    .object({
      slug: z.string(),
      title: z.string(),
      priceCents: z.number().int().nonnegative(),
      oldPriceCents: z.number().int().nonnegative().nullable(),
    })
    .nullable(),
  coupon: couponSchema.nullable(),
  location: z.object({
    address: nstr,
    neighborhood: nstr,
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    distanceKm: z.number().nonnegative().nullable(),
  }),
  more: z.array(searchItemSchema),
  similar: z.array(searchItemSchema),
});
export type OfferPage = z.infer<typeof offerPageSchema>;

export const offerApi = {
  get: (slug: string) => api(`/offers/${encodeURIComponent(slug)}`, offerPageSchema),
};
