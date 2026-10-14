"use client";

import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import Link from "next/link";

import { resultHref } from "@/components/search/result-card";
import { useUserLocation } from "@/hooks/use-user-location";
import { fetchHome } from "@/lib/api/home";
import { routes } from "@/lib/routes";

/** 404 (Documento de entrega › Telas de sistema). As sugestões vêm da busca real; sem local ou sem dados, somem. */
export function NotFoundView() {
  const { location, isLoading } = useUserLocation();
  const hasPlace = !!location.label || (location.lat !== null && location.lng !== null);
  const near = useQuery({
    queryKey: ["home", "not-found", location.lat, location.lng, location.label, location.radiusKm],
    queryFn: () =>
      fetchHome({ lat: location.lat, lng: location.lng, where: location.label, radiusKm: location.radiusKm }),
    enabled: !isLoading && hasPlace,
    retry: false,
  });
  const suggestions = (near.data?.sections ?? []).flatMap((s) => s.items).slice(0, 3);

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-selected text-link">
        <Compass className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">
        Essa página saiu do mapa
      </h1>
      <p className="text-text-muted">
        O endereço pode ter mudado ou nunca ter existido. Vamos te levar de volta.
      </p>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={routes.home}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-bold text-on-primary hover:bg-primary-hover"
        >
          Voltar ao início
        </Link>
        <Link
          href={routes.explorar}
          className="inline-flex h-12 items-center justify-center rounded-lg border border-border-strong px-6 font-semibold text-text-2 hover:bg-surface-2"
        >
          Explorar perto de mim
        </Link>
      </div>
      <div className="mt-4 w-full text-left">
        <h2 className="mb-2 font-bold text-text-strong">Que tal ver isto?</h2>
        {suggestions.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
            {near.isError
              ? "Não foi possível carregar sugestões agora. Use os botões acima para continuar."
              : near.isPending && hasPlace
                ? "Buscando sugestões perto de você…"
                : hasPlace
                  ? "Ainda não há sugestões para o seu local."
                  : "Defina seu local no topo da página para ver sugestões perto de você."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {suggestions.map((s) => (
              <li key={s.id}>
                <Link
                  href={resultHref(s)}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2 hover:bg-surface-2"
                >
                  <span className="font-semibold text-text-strong">{s.title}</span>
                  {s.distanceKm !== null && (
                    <span className="text-sm text-text-muted">
                      {s.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
