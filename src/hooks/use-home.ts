"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHome } from "@/lib/api/home";

import { useUserLocation } from "./use-user-location";

/** A resposta de `GET /discovery/home`, compartilhada pelo mapa e pelos blocos (a mesma consulta, uma só chamada). */
export function useHomeData() {
  const { location, isLoading: locLoading } = useUserLocation();
  const hasPlace = location.lat !== null || location.label.trim().length > 0;
  const query = useQuery({
    queryKey: ["home", location.lat, location.lng, location.label, location.radiusKm],
    queryFn: () =>
      fetchHome({ lat: location.lat, lng: location.lng, where: location.label, radiusKm: location.radiusKm }),
    enabled: !locLoading && hasPlace,
  });
  return { location, locLoading, hasPlace, query };
}
