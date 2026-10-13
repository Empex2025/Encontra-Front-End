import { z } from "zod";

import { alertSchema, couponSchema } from "./catalog";
import { api } from "./client";

/** Ações do usuário logado. Contrato: docs/contratos/decidir.md › Ações. */
const none = z.undefined();
const seg = encodeURIComponent;

export type AlertCondition = "restock" | "price_drop" | "promo" | "other_store";
export type AlertChannel = "site" | "whatsapp" | "email";

export const actions = {
  follow: (profileId: string, on: boolean) =>
    api(`/profiles/${seg(profileId)}/follow`, none, { method: on ? "POST" : "DELETE" }),
  setBell: (profileId: string, enabled: boolean) =>
    api(`/profiles/${seg(profileId)}/bell`, none, { method: "PUT", body: { enabled } }),
  favorite: (type: "product" | "profile", id: string, on: boolean) =>
    on
      ? api("/me/favorites", none, { method: "POST", body: { type, id } })
      : api(`/me/favorites/${type}/${seg(id)}`, none, { method: "DELETE" }),
  createAlert: (body: {
    productId: string;
    conditions: AlertCondition[];
    belowCents?: number;
    size?: string;
    radiusKm: 5 | 10 | 20;
    channels: AlertChannel[];
  }) => api("/me/alerts", alertSchema, { method: "POST", body }),
  deleteAlert: (id: string) => api(`/me/alerts/${seg(id)}`, none, { method: "DELETE" }),
  claimCoupon: (id: string) => api(`/coupons/${seg(id)}/claim`, couponSchema, { method: "POST" }),
  startConversation: (body: { profileId: string; productId?: string; serviceId?: string; draft?: string }) =>
    api("/conversations", z.object({ id: z.string() }), { method: "POST", body }),
  createQuote: (body: {
    profileId: string;
    serviceId: string;
    when: "today" | "tomorrow" | "week" | "flexible";
    neighborhood?: string;
    details?: string;
    via: "chat" | "whatsapp";
  }) =>
    api(
      "/quotes",
      z.object({ id: z.string(), conversationId: z.string().nullable(), whatsappUrl: z.string().nullable() }),
      { method: "POST", body },
    ),
  helpful: (reviewId: string, on: boolean) =>
    api(`/reviews/${seg(reviewId)}/helpful`, z.object({ helpfulCount: z.number().int().nonnegative() }), {
      method: on ? "POST" : "DELETE",
    }),
  liveReminder: (liveId: string, on: boolean) =>
    api(`/lives/${seg(liveId)}/reminder`, none, { method: on ? "POST" : "DELETE" }),
  likePost: (postId: string, on: boolean) =>
    api(`/posts/${seg(postId)}/like`, z.object({ likes: z.number().int().nonnegative() }), {
      method: on ? "POST" : "DELETE",
    }),
  share: (type: "product" | "profile", id: string) =>
    api(`/share/${type}/${seg(id)}`, z.object({ url: z.string(), title: z.string(), text: z.string() })),
};
