import { z } from "zod";

import { couponSchema } from "./catalog";
import { api } from "./client";
import { radiusSchema } from "./schemas";

/** Contrato: docs/contratos/descobrir.md */
const none = z.undefined();
const seg = encodeURIComponent;
const nstr = z.string().nullable();
const count = z.number().int().nonnegative();

/* ---------- Stories ---------- */

export const storyTagSchema = z.object({
  kind: z.enum(["product", "service", "offer", "place"]),
  title: z.string(),
  priceCents: count.nullable(),
  productId: nstr,
  productSlug: nstr,
  couponId: nstr,
  imageUrl: nstr,
});
export type StoryTag = z.infer<typeof storyTagSchema>;

export const storySchema = z.object({
  id: z.string(),
  mediaUrl: z.string(),
  mediaType: z.enum(["image", "video"]),
  caption: nstr,
  publishedAt: z.string(),
  views: count,
  likes: count,
  liked: z.boolean(),
  saved: z.boolean(),
  tag: storyTagSchema.nullable(),
});
export type Story = z.infer<typeof storySchema>;

export const storyGroupSchema = z.object({
  profile: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    kind: z.enum(["store", "provider"]),
    verified: z.boolean(),
    avatarUrl: nstr,
    typeLabel: nstr,
  }),
  distanceKm: z.number().nonnegative().nullable(),
  following: z.boolean(),
  /** Todos os stories do grupo já vistos por esta conta (o servidor guarda). */
  seen: z.boolean().optional(),
  /** Destaque do perfil: no lugar do tipo aparece "Destaque" e no lugar do km, o nome. */
  highlight: z.object({ id: z.string(), name: z.string() }).nullable(),
  stories: z.array(storySchema).min(1),
});
export type StoryGroup = z.infer<typeof storyGroupSchema>;

export const storiesSchema = z.object({
  groups: z.array(storyGroupSchema),
  /** Nomes dos 2 primeiros interesses, para "Mais para você · por causa de…". */
  interests: z.array(z.string()),
});

/* ---------- Ao vivo ---------- */

export const liveProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  priceCents: count.nullable(),
  oldPriceCents: count.nullable(),
  tag: nstr,
  imageUrl: nstr,
  pinned: z.boolean(),
});

export const liveSchema = z.object({
  id: z.string(),
  title: z.string(),
  profile: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    kind: z.enum(["store", "provider"]),
    verified: z.boolean(),
    following: z.boolean(),
    whatsapp: nstr,
  }),
  place: nstr,
  viewers: count,
  likes: count,
  startedAt: z.string(),
  endedAt: nstr,
  coverUrl: nstr,
  /** Endereço do stream; null enquanto não há streaming configurado. */
  streamUrl: nstr,
  status: z.enum(["live", "ended"]),
  products: z.array(liveProductSchema),
  /** Lembrete por loja ("avise quando entrar ao vivo"). */
  reminder: z.boolean(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});
export type Live = z.infer<typeof liveSchema>;

export const liveMessageSchema = z.object({
  id: z.string(),
  author: z.string(),
  fromStore: z.boolean(),
  mine: z.boolean(),
  text: z.string(),
  sentAt: z.string(),
});
export type LiveMessage = z.infer<typeof liveMessageSchema>;
const liveMessagesSchema = z.object({ items: z.array(liveMessageSchema) });
const otherLivesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      viewers: count,
      coverUrl: nstr,
      profileName: z.string(),
      place: nstr,
    }),
  ),
});

/* ---------- Evento ---------- */

export const happeningSchema = z.object({
  id: z.string(),
  title: z.string(),
  organizer: z.object({
    name: z.string(),
    slug: nstr,
    profileId: nstr,
    kind: z.enum(["store", "provider"]).nullable(),
  }),
  neighborhood: nstr,
  distanceKm: z.number().nonnegative().nullable(),
  address: nstr,
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  startsAt: z.string(),
  endsAt: nstr,
  free: z.boolean(),
  priceCents: count.nullable(),
  coverUrl: nstr,
  about: nstr,
  schedule: z.array(z.object({ time: z.string(), title: z.string(), detail: nstr })),
  offer: couponSchema.nullable(),
  going: count,
  interested: count,
  tags: z.array(z.string()),
  /** O que a pessoa marcou: "going", "interested" ou nada. Exclusivos. */
  myAttendance: z.enum(["going", "interested"]).nullable(),
  attendeesPreview: z.array(z.object({ name: z.string(), avatarUrl: nstr })),
  followedGoing: count,
  /** Link do organizador para inscrição paga, se houver. */
  signupWhatsapp: nstr,
});
export type Happening = z.infer<typeof happeningSchema>;
const nearbyHappeningsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      startsAt: z.string(),
      neighborhood: nstr,
      distanceKm: z.number().nonnegative().nullable(),
      free: z.boolean(),
      coverUrl: nstr,
    }),
  ),
});
export type NearbyHappening = z.infer<typeof nearbyHappeningsSchema>["items"][number];

const likeSchema = z.object({ likes: count });

export const discover = {
  stories: (q: {
    lat: number | null;
    lng: number | null;
    radiusKm: number;
    start?: string | null;
    profile?: string | null;
    highlight?: string | null;
    /** Só a faixa da Home: seguidos primeiro, depois até 6 não seguidos. */
    preview?: boolean;
  }) =>
    api("/stories", storiesSchema, {
      query: {
        lat: q.lat,
        lng: q.lng,
        radiusKm: radiusSchema.parse(q.radiusKm),
        start: q.start,
        profile: q.profile,
        highlight: q.highlight,
        preview: q.preview ? 1 : undefined,
      },
    }),
  view: (id: string) => api(`/stories/${seg(id)}/view`, none, { method: "POST" }),
  like: (id: string, on: boolean) =>
    api(`/stories/${seg(id)}/like`, likeSchema, { method: on ? "POST" : "DELETE" }),
  save: (id: string, on: boolean) =>
    api(`/stories/${seg(id)}/save`, none, { method: on ? "POST" : "DELETE" }),

  live: (id: string) => api(`/lives/${seg(id)}`, liveSchema),
  liveMessages: (id: string, after?: string) =>
    api(`/lives/${seg(id)}/messages`, liveMessagesSchema, { query: { after } }),
  sendLiveMessage: (id: string, text: string) =>
    api(`/lives/${seg(id)}/messages`, liveMessageSchema, { method: "POST", body: { text } }),
  likeLive: (id: string) => api(`/lives/${seg(id)}/like`, likeSchema, { method: "POST" }),
  otherLives: (q: { lat: number | null; lng: number | null; radiusKm: number; exclude: string }) =>
    api("/lives", otherLivesSchema, {
      query: { status: "live", lat: q.lat, lng: q.lng, radiusKm: q.radiusKm, exclude: q.exclude },
    }),

  happening: (id: string) => api(`/happenings/${seg(id)}`, happeningSchema),
  nearbyHappenings: (q: { lat: number | null; lng: number | null; radiusKm: number; exclude: string }) =>
    api("/happenings", nearbyHappeningsSchema, { query: { ...q } }),
  attend: (id: string, kind: "going" | "interested" | null, previous: "going" | "interested" | null) =>
    kind
      ? api(`/happenings/${seg(id)}/attendance`, none, { method: "POST", body: { kind } })
      : api(`/happenings/${seg(id)}/attendance`, none, { method: "DELETE", query: { kind: previous } }),
};
