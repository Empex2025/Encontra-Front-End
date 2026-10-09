"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { endpoints, queryKeys } from "@/lib/api/endpoints";
import type { UserLocation } from "@/lib/api/schemas";
import { DEFAULT_RADIUS, isRadius } from "@/lib/domain/radius";

import { useSession } from "./use-session";

const GUEST_KEY = "encontrae_local";
/** Sem local definido ainda: o cabeçalho mostra "Definir local". */
const EMPTY: UserLocation = { label: "", lat: null, lng: null, radiusKm: DEFAULT_RADIUS };

/** Visitante: o local fica só neste navegador (conveniência). Logado: vem de /me/location. */
function readGuest(): UserLocation {
  try {
    const v = JSON.parse(window.localStorage.getItem(GUEST_KEY) ?? "null") as Partial<UserLocation> | null;
    if (v && typeof v.label === "string" && isRadius(v.radiusKm)) {
      return { label: v.label, lat: v.lat ?? null, lng: v.lng ?? null, radiusKm: v.radiusKm };
    }
  } catch {}
  return EMPTY;
}

export function useUserLocation() {
  const { me, isLoading } = useSession();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.location, me ? "user" : "guest"],
    queryFn: () => (me ? endpoints.location() : Promise.resolve(readGuest())),
    enabled: !isLoading,
  });

  const save = useMutation({
    mutationFn: async (next: UserLocation) => {
      if (me) return endpoints.saveLocation(next);
      try {
        window.localStorage.setItem(GUEST_KEY, JSON.stringify(next));
      } catch {}
      return next;
    },
    onSuccess: (data) => {
      qc.setQueryData([...queryKeys.location, me ? "user" : "guest"], data);
      // resultados dependem do local e do raio
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "me" && q.queryKey[0] !== "unread-count" });
    },
  });

  return { location: query.data ?? EMPTY, isLoading: query.isPending, save };
}
