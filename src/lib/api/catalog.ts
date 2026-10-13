import { z } from "zod";

import { CATEGORY_IDS } from "@/lib/domain/categories";

import { api } from "./client";
import { searchItemSchema, searchResponseSchema } from "./search";

/** Contrato: docs/contratos/decidir.md */

const categoryId = z.enum(CATEGORY_IDS);
const nullableStr = z.string().nullable();

export const profileSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  kind: z.enum(["store", "provider"]),
  name: z.string(),
  handle: nullableStr,
  avatarUrl: nullableStr,
  verified: z.boolean(),
  verification: z.enum(["verified", "pending", "none"]),
  followers: z.number().int().nonnegative(),
  following: z.boolean(),
  status: z.object({ state: z.enum(["open", "soon", "closed"]), text: z.string() }).nullable(),
  whatsapp: nullableStr,
  responseTime: nullableStr,
  live: z.object({ id: z.string(), viewers: z.number().int().nonnegative() }).nullable(),
  categoryId: categoryId.nullable(),
});
export type ProfileSummary = z.infer<typeof profileSummarySchema>;

export const couponSchema = z.object({
  id: z.string(),
  title: z.string(),
  code: z.string(),
  percentOff: z.number(),
  minCents: z.number().int().nonnegative().nullable().optional(),
  priceCents: z.number().int().nonnegative().nullable().optional(),
  validUntil: z.string(),
  claimed: z.boolean(),
});
export type Coupon = z.infer<typeof couponSchema>;

export const alertSchema = z.object({
  id: z.string(),
  productId: z.string(),
  conditions: z.array(z.enum(["restock", "price_drop", "promo", "other_store"])),
  belowCents: z.number().int().nullable(),
  size: nullableStr,
  radiusKm: z.number(),
  channels: z.array(z.enum(["site", "whatsapp", "email"])),
  city: nullableStr.optional(),
  expiresAt: z.string(),
});
export type Alert = z.infer<typeof alertSchema>;

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: nullableStr,
  categoryId: categoryId.nullable(),
  group: z.object({ id: z.string(), label: z.string() }).nullable(),
  media: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["image", "video"]),
      url: z.string(),
      posterUrl: nullableStr,
      viewsText: nullableStr,
    }),
  ),
  profile: profileSummarySchema,
  rating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative(),
  sold: z.number().int().nonnegative().nullable(),
  price: z
    .object({
      amountCents: z.number().int().nonnegative(),
      oldAmountCents: z.number().int().nonnegative().nullable(),
      updatedAt: nullableStr,
    })
    .nullable(),
  location: z.object({
    distanceKm: z.number().nonnegative().nullable(),
    neighborhood: nullableStr,
    city: nullableStr,
    lat: z.number().nullable(),
    lng: z.number().nullable(),
  }),
  sizes: z.array(z.object({ label: z.string(), available: z.boolean() })).nullable(),
  stock: z.object({
    state: z.enum(["available", "unavailable", "unknown"]),
    units: z.number().int().nonnegative().nullable(),
    pickupText: nullableStr,
  }),
  maxQuantity: z.number().int().min(1).max(6),
  storeBadges: z.array(z.string()),
  specs: z.array(z.object({ label: z.string(), value: z.string() })),
  coupon: couponSchema.nullable(),
  sameLine: z
    .object({
      count: z.number().int().nonnegative(),
      fromCents: z.number().int().nonnegative(),
      promoCount: z.number().int().nonnegative(),
    })
    .nullable(),
  favorited: z.boolean(),
  alert: alertSchema.nullable(),
  about: z.object({ address: nullableStr, hoursText: nullableStr, responseTime: nullableStr }),
});
export type Product = z.infer<typeof productSchema>;

const hourSchema = z.object({ day: z.number().int().min(0).max(6), text: z.string() });

export const providerSchema = z.object({
  title: z.string(),
  group: z.object({ id: z.string(), label: z.string() }).nullable(),
  serviceMode: z.enum(["local", "home", "both"]),
  homeRadiusKm: z.number().nullable(),
  areas: z.array(z.string()),
  jobsDone: z.number().int().nullable(),
  yearsExperience: z.number().int().nullable(),
  recommendPct: z.number().int().min(0).max(100).nullable(),
  nextSlot: nullableStr,
  services: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: nullableStr,
      durationMinutes: z.number().int().nullable(),
      fromCents: z.number().int().nullable(),
    }),
  ),
  photos: z.array(z.object({ id: z.string(), url: z.string() })),
});
export type ProviderData = z.infer<typeof providerSchema>;

export const profileSchema = profileSummarySchema.extend({
  bio: nullableStr,
  categoryLabel: nullableStr,
  coverUrl: nullableStr,
  stats: z.object({
    rating: z.number().min(0).max(5).nullable(),
    reviewCount: z.number().int().nonnegative(),
    products: z.number().int().nonnegative(),
    posts: z.number().int().nonnegative(),
    respondsPct: z.number().int().min(0).max(100).nullable(),
  }),
  followedBy: z.object({ names: z.array(z.string()), others: z.number().int().nonnegative() }).nullable(),
  address: z
    .object({
      street: nullableStr,
      neighborhood: nullableStr,
      city: nullableStr,
      lat: z.number().nullable(),
      lng: z.number().nullable(),
      distanceKm: z.number().nonnegative().nullable(),
    })
    .nullable(),
  hours: z.array(hourSchema),
  since: z.object({ business: z.number().int().nullable(), platform: z.number().int().nullable() }),
  badges: z.array(z.string()),
  payment: z.array(z.string()),
  cnpjVerified: z.boolean(),
  highlights: z.array(
    z.object({ id: z.string(), label: z.string(), coverUrl: nullableStr, seen: z.boolean() }),
  ),
  provider: providerSchema.nullable(),
});
export type Profile = z.infer<typeof profileSchema>;

export const postSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video"]),
  url: z.string(),
  posterUrl: nullableStr,
  caption: nullableStr,
  createdAt: z.string(),
  viewsText: nullableStr,
  durationText: nullableStr,
  likes: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  liked: z.boolean(),
  product: z
    .object({ slug: z.string(), title: z.string(), priceCents: z.number().int().nonnegative() })
    .nullable(),
});
export type Post = z.infer<typeof postSchema>;

export const postsSchema = z.object({
  items: z.array(postSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export const offersSchema = z.object({
  coupon: couponSchema.nullable(),
  live: z.object({ id: z.string(), title: z.string(), viewers: z.number().int().nonnegative() }).nullable(),
  upcomingLives: z.array(
    z.object({ id: z.string(), title: z.string(), startsAt: z.string(), reminded: z.boolean() }),
  ),
  event: z.object({ id: z.string(), title: z.string(), startsAt: z.string(), place: nullableStr }).nullable(),
  promoCount: z.number().int().nonnegative(),
});
export type Offers = z.infer<typeof offersSchema>;

export const REVIEW_SORTS = ["recent", "helpful"] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number];

export const reviewsSchema = z.object({
  summary: z.object({
    average: z.number().min(0).max(5).nullable(),
    total: z.number().int().nonnegative(),
    distribution: z.record(z.number().int().nonnegative()),
    attributes: z.array(z.object({ label: z.string(), value: z.number() })).optional(),
    recommendPct: z.number().int().min(0).max(100).nullable().optional(),
  }),
  filters: z.array(z.object({ id: z.string(), label: z.string(), count: z.number().int().nonnegative() })),
  items: z.array(
    z.object({
      id: z.string(),
      author: z.string(),
      createdAt: z.string(),
      context: nullableStr,
      sizeLabel: nullableStr,
      rating: z.number().min(1).max(5),
      text: z.string(),
      photoUrls: z.array(z.string()),
      helpfulCount: z.number().int().nonnegative(),
      markedHelpful: z.boolean(),
      reply: z.object({ author: z.string(), text: z.string(), createdAt: z.string() }).nullable(),
    }),
  ),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type ReviewsPage = z.infer<typeof reviewsSchema>;
export type Review = ReviewsPage["items"][number];

const itemsOnly = z.object({ items: z.array(searchItemSchema) });

const seg = encodeURIComponent;
export const REVIEWS_PAGE_SIZE = 5;

export const catalog = {
  product: (slug: string) => api(`/products/${seg(slug)}`, productSchema),
  related: (slug: string) => api(`/products/${seg(slug)}/related`, itemsOnly),
  profile: (slug: string) => api(`/profiles/${seg(slug)}`, profileSchema),
  similar: (slug: string) => api(`/profiles/${seg(slug)}/similar`, itemsOnly),
  offers: (slug: string) => api(`/profiles/${seg(slug)}/offers`, offersSchema),
  posts: (slug: string, page: number) =>
    api(`/profiles/${seg(slug)}/posts`, postsSchema, { query: { page, limit: 12 } }),
  profileProducts: (
    slug: string,
    q: {
      q: string;
      sort: "best_selling" | "price_asc" | "price_desc";
      cat?: string;
      page: number;
      lat: number | null;
      lng: number | null;
    },
  ) =>
    api(`/profiles/${seg(slug)}/products`, searchResponseSchema, {
      query: { q: q.q, sort: q.sort, cat: q.cat, page: q.page, limit: 12, lat: q.lat, lng: q.lng },
    }),
  reviews: (
    target: "products" | "profiles",
    slug: string,
    q: { filter: string; sort: ReviewSort; page: number },
  ) =>
    api(`/${target}/${seg(slug)}/reviews`, reviewsSchema, {
      query: { filter: q.filter, sort: q.sort, page: q.page, limit: REVIEWS_PAGE_SIZE },
    }),
};

/** Ofertas & Promoções (contrato: docs/contratos/decidir.md › GET /offers). */
export const offersPageSchema = searchResponseSchema.extend({
  coupons: z.array(
    couponSchema.extend({
      profile: profileSummarySchema.pick({ id: true, slug: true, name: true, avatarUrl: true }),
    }),
  ),
});
export type OffersPage = z.infer<typeof offersPageSchema>;
export const OFFER_SORTS = ["relevance", "distance", "price", "discount"] as const;
export type OfferSort = (typeof OFFER_SORTS)[number];
export const OFFERS_PAGE_SIZE = 12;

export function fetchOffers(q: {
  q: string;
  cat?: string;
  sort: OfferSort;
  openNow: boolean;
  radiusKm: number;
  lat: number | null;
  lng: number | null;
  where: string;
  page: number;
}) {
  const hasPoint = q.lat !== null && q.lng !== null;
  return api("/offers", offersPageSchema, {
    query: {
      q: q.q || undefined,
      cat: q.cat,
      sort: q.sort,
      openNow: q.openNow ? 1 : undefined,
      radiusKm: q.radiusKm,
      lat: hasPoint ? q.lat : undefined,
      lng: hasPoint ? q.lng : undefined,
      where: hasPoint ? undefined : q.where,
      page: q.page,
      limit: OFFERS_PAGE_SIZE,
    },
  });
}
