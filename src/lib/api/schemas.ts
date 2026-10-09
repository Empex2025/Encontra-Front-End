import { z } from "zod";

import { RADIUS_STEPS } from "@/lib/domain/radius";

export const radiusSchema = z
  .number()
  .refine((n) => (RADIUS_STEPS as readonly number[]).includes(n), "Raio fora da escala");

export const meSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable().optional(),
  counters: z.object({
    favorites: z.number().int(),
    following: z.number().int(),
    alerts: z.number().int(),
  }),
});
export type Me = z.infer<typeof meSchema>;

export const locationSchema = z.object({
  /** Texto exibido no cabeçalho, ex.: "Centro, Maceió - AL" */
  label: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  radiusKm: radiusSchema,
});
export type UserLocation = z.infer<typeof locationSchema>;

export const unreadCountSchema = z.object({
  conversations: z.number().int().nonnegative(),
  notifications: z.number().int().nonnegative(),
});
export type UnreadCount = z.infer<typeof unreadCountSchema>;

export const suggestionSchema = z.object({
  text: z.string(),
  /** ex.: "Serviço · Automotivo" */
  hint: z.string(),
});
export const suggestionsSchema = z.object({
  items: z.array(suggestionSchema),
  trending: z.array(z.string()),
});
export type Suggestions = z.infer<typeof suggestionsSchema>;

export const placesSchema = z.object({ items: z.array(z.object({ label: z.string() })) });
