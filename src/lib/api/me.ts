import { z } from "zod";

import { alertSchema } from "./catalog";
import { api } from "./client";
import { searchItemSchema } from "./search";

/** Contrato: docs/contratos/acompanhar.md */
const none = z.undefined();
const seg = encodeURIComponent;
const nstr = z.string().nullable();
const count = z.number().int().nonnegative();

/* ---------- Favoritos, seguidos, listas, alertas ---------- */

export const favoriteSchema = z.object({
  item: searchItemSchema,
  savedAt: z.string(),
  change: z
    .object({ kind: z.enum(["price_drop", "event"]), text: z.string() })
    .nullable()
    .optional(),
  listCount: count.optional(),
});
export type Favorite = z.infer<typeof favoriteSchema>;

export const favoritesSchema = z.object({
  items: z.array(favoriteSchema),
  counts: z.object({ all: count, priceDrop: count, products: count, services: count }),
});

export const FAVORITE_SORTS = ["recent", "price", "distance"] as const;
export type FavoriteSort = (typeof FAVORITE_SORTS)[number];
export type FavoriteFilter = "all" | "price_drop" | "product" | "service";

const followingSchema = z.object({
  items: z.array(
    z.object({
      profile: z.object({
        id: z.string(),
        slug: z.string(),
        kind: z.enum(["store", "provider", "place"]),
        name: z.string(),
        avatarUrl: nstr,
        verified: z.boolean(),
        typeLabel: nstr,
        distanceKm: z.number().nonnegative().nullable(),
        whatsapp: nstr,
      }),
      news: z.object({ kind: z.enum(["coupon", "new"]), text: z.string() }).nullable(),
    }),
  ),
});
export type Followed = z.infer<typeof followingSchema>["items"][number];

export const listSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  itemCount: count,
  shared: z.boolean(),
  sharedWith: nstr,
  thumbnails: z.array(z.string()),
});
export type ListSummary = z.infer<typeof listSummarySchema>;
const listsSchema = z.object({ items: z.array(listSummarySchema) });
const listDetailSchema = listSummarySchema.extend({ items: z.array(favoriteSchema) });

export const savedComparisonSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  group: z.object({ id: z.string(), label: z.string() }),
  items: z
    .array(z.object({ ref: z.string(), title: z.string(), imageUrl: nstr }))
    .min(2)
    .max(3),
});
export type SavedComparison = z.infer<typeof savedComparisonSchema>;
const savedComparisonsSchema = z.object({ items: z.array(savedComparisonSchema) });

export const alertRowSchema = alertSchema.extend({
  active: z.boolean(),
  lastTrigger: z.object({ at: z.string(), text: z.string() }).nullable(),
  product: z.object({ id: z.string(), slug: z.string(), title: z.string(), imageUrl: nstr }),
  profile: z.object({ name: z.string() }).nullable(),
});
export type AlertRow = z.infer<typeof alertRowSchema>;
const alertsSchema = z.object({ items: z.array(alertRowSchema) });

export const me = {
  favorites: (q: {
    kind?: "product" | "service";
    filter?: "price_drop";
    sort: FavoriteSort;
    lat: number | null;
    lng: number | null;
  }) => api("/me/favorites", favoritesSchema, { query: q }),
  following: () => api("/me/following", followingSchema),
  lists: () => api("/me/lists", listsSchema),
  list: (id: string) => api(`/me/lists/${seg(id)}`, listDetailSchema),
  createList: (name: string) => api("/me/lists", listSummarySchema, { method: "POST", body: { name } }),
  deleteList: (id: string) => api(`/me/lists/${seg(id)}`, none, { method: "DELETE" }),
  addToList: (id: string, type: "product" | "service", itemId: string) =>
    api(`/me/lists/${seg(id)}/items`, none, { method: "POST", body: { type, id: itemId } }),
  removeFromList: (id: string, type: "product" | "service", itemId: string) =>
    api(`/me/lists/${seg(id)}/items/${type}/${seg(itemId)}`, none, { method: "DELETE" }),
  shareList: (id: string) =>
    api(`/me/lists/${seg(id)}/share`, z.object({ url: z.string() }), { method: "POST" }),
  comparisons: () => api("/me/comparisons", savedComparisonsSchema),
  saveComparison: (body: { name: string; items: string[] }) =>
    api("/me/comparisons", savedComparisonSchema, { method: "POST", body }),
  deleteComparison: (id: string) => api(`/me/comparisons/${seg(id)}`, none, { method: "DELETE" }),
  alerts: () => api("/me/alerts", alertsSchema),
  setAlertActive: (id: string, active: boolean) =>
    api(`/me/alerts/${seg(id)}`, none, { method: "PATCH", body: { active } }),
};

/* ---------- Notificações ---------- */

export const NOTIFICATION_TYPES = ["alert", "coupon", "store", "activity", "security"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string(),
  text: nstr,
  createdAt: z.string(),
  read: z.boolean(),
  imageUrl: nstr,
  action: z.object({ label: z.string(), href: z.string() }).nullable(),
});
export type Notification = z.infer<typeof notificationSchema>;
const notificationsSchema = z.object({
  items: z.array(notificationSchema),
  total: count,
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  unread: z.object({ all: count, alert: count, coupon: count, store: count, activity: count }),
});
export const prefsSchema = z.object({
  categories: z.object({
    alerts: z.boolean(),
    offers: z.boolean(),
    stores: z.boolean(),
    chat: z.boolean(),
    nearby: z.boolean(),
    /** Sempre ligado: o servidor devolve true e ignora tentativa de desligar. */
    security: z.boolean(),
  }),
  channels: z.object({
    /** Sempre ligado. */
    site: z.boolean(),
    whatsapp: z.boolean(),
    email: z.boolean(),
  }),
  /** "Não perturbe à noite" (22h às 8h). */
  quietHours: z.boolean(),
});
export type PrefsPatch = {
  categories?: Partial<z.infer<typeof prefsSchema>["categories"]>;
  channels?: Partial<z.infer<typeof prefsSchema>["channels"]>;
  quietHours?: boolean;
};
export type NotificationPrefs = z.infer<typeof prefsSchema>;
export const NOTIFICATIONS_PAGE_SIZE = 20;

export const notifications = {
  list: (type: "alert" | "coupon" | "store" | "activity" | undefined, page: number) =>
    api("/notifications", notificationsSchema, { query: { type, page, limit: NOTIFICATIONS_PAGE_SIZE } }),
  read: (id: string) => api(`/notifications/${seg(id)}/read`, none, { method: "POST" }),
  readAll: (type?: string) =>
    api("/notifications/read-all", none, { method: "POST", body: type ? { type } : {} }),
  remove: (id: string) => api(`/notifications/${seg(id)}`, none, { method: "DELETE" }),
  prefs: () => api("/me/notification-prefs", prefsSchema),
  savePrefs: (body: PrefsPatch) => api("/me/notification-prefs", prefsSchema, { method: "PATCH", body }),
};

/* ---------- Atividade ---------- */

export const QUOTE_STATUSES = ["waiting", "answered", "accepted", "done", "declined", "canceled"] as const;
export const quoteSchema = z.object({
  id: z.string(),
  profile: z.object({ slug: z.string(), name: z.string(), kind: z.enum(["store", "provider"]) }).nullable(),
  service: z.string(),
  when: nstr,
  createdAt: z.string(),
  status: z.enum(QUOTE_STATUSES),
  priceCents: z.number().int().nonnegative().nullable(),
  note: nstr,
  conversationId: nstr,
});
export type Quote = z.infer<typeof quoteSchema>;

export const wantRowSchema = z.object({
  id: z.string(),
  term: z.string(),
  radiusKm: z.number(),
  deadline: z.enum(["today", "week", "month"]),
  maxPriceCents: z.number().int().nullable(),
  people: count,
  profilesNotified: count,
  status: z.enum(["waiting", "found", "expired", "canceled"]),
  createdAt: z.string(),
  found: z.object({ count, href: z.string() }).nullable().optional(),
});
export type WantRow = z.infer<typeof wantRowSchema>;

export const myReviewSchema = z.object({
  id: z.string(),
  targetType: z.string(),
  targetTitle: z.string(),
  targetHref: nstr,
  createdAt: z.string(),
  rating: z.number().int().min(1).max(5),
  text: nstr,
  photoCount: count,
  status: z.enum(["pending", "published"]),
  reply: nstr,
});
export type MyReview = z.infer<typeof myReviewSchema>;

export const myCouponSchema = z.object({
  id: z.string(),
  code: z.string(),
  benefit: z.string(),
  status: z.enum(["active", "used", "expired"]),
  profile: z.object({ slug: z.string(), name: z.string() }),
  validUntil: z.string(),
});
export type MyCoupon = z.infer<typeof myCouponSchema>;

const items = <T extends z.ZodTypeAny>(s: T) => z.object({ items: z.array(s) });

export const activity = {
  summary: () =>
    api("/me/activity/summary", z.object({ quotes: count, wants: count, reviews: count, coupons: count })),
  quotes: () => api("/me/quotes", items(quoteSchema)),
  acceptQuote: (id: string) => api(`/quotes/${seg(id)}/accept`, none, { method: "POST" }),
  cancelQuote: (id: string) => api(`/quotes/${seg(id)}/cancel`, none, { method: "POST" }),
  wants: () => api("/me/wants", items(wantRowSchema)),
  cancelWant: (id: string) => api(`/me/wants/${seg(id)}/cancel`, none, { method: "POST" }),
  reviews: () => api("/me/reviews", items(myReviewSchema)),
  editReview: (id: string, body: { rating: number; text: string }) =>
    api(`/me/reviews/${seg(id)}`, myReviewSchema, { method: "PATCH", body }),
  deleteReview: (id: string) => api(`/me/reviews/${seg(id)}`, none, { method: "DELETE" }),
  coupons: () => api("/me/coupons", items(myCouponSchema)),
  recent: (refs: string[]) =>
    api(
      "/recent",
      items(
        z.object({ type: z.string(), slug: z.string(), title: z.string(), imageUrl: nstr, href: z.string() }),
      ),
      { query: { items: refs.join(",") } },
    ),
};
