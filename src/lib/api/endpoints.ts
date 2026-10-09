import { api } from "./client";
import {
  locationSchema,
  placesSchema,
  meSchema,
  suggestionsSchema,
  type UserLocation,
  unreadCountSchema,
} from "./schemas";

/** Chamadas usadas pela estrutura global. Caminhos: aba "Chamadas da API" do documento de entrega. */
export const endpoints = {
  me: () => api("/me", meSchema),
  location: () => api("/me/location", locationSchema),
  saveLocation: (body: Pick<UserLocation, "label" | "lat" | "lng" | "radiusKm">) =>
    api("/me/location", locationSchema, { method: "PUT", body }),
  unreadCount: () => api("/notifications/unread-count", unreadCountSchema),
  autocomplete: (q: string) => api("/search/autocomplete", suggestionsSchema, { query: { q } }),
  placeAutocomplete: (q: string) =>
    api("/search/autocomplete", placesSchema, { query: { type: "place", q } }),
};

export const queryKeys = {
  me: ["me"] as const,
  location: ["me", "location"] as const,
  unread: ["unread-count"] as const,
  autocomplete: (q: string) => ["autocomplete", q] as const,
  places: (q: string) => ["autocomplete", "place", q] as const,
};
