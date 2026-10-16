"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import Link from "next/link";

import { resultHref } from "@/components/search/result-card";
import { useUserLocation } from "@/hooks/use-user-location";
import { fetchHome } from "@/lib/api/home";
import { SystemCard, sysBtnOutline, sysBtnPrimary } from "@/components/system/system-card";
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
    <SystemCard
      tone="amber"
      icon={<MapPin className="size-10" aria-hidden />}
      eyebrow="Erro 404"
      title="Essa página saiu do mapa"
      text="O link pode estar errado ou a página foi removida. Que tal ver o que está acontecendo perto de você?"
    >
      <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Link href={routes.home} className={sysBtnOutline}>
          Voltar ao início
        </Link>
        <Link href={routes.explorar} className={sysBtnPrimary}>
          Explorar perto de mim
        </Link>
      </div>
      {suggestions.length > 0 ? (
        <ul className="mt-4 grid w-full max-w-[780px] gap-3 text-left sm:grid-cols-3">
          {suggestions.map((s) => (
            <li key={s.id}>
              <Link
                href={resultHref(s)}
                className="flex min-h-[72px] flex-col justify-center rounded-xl border border-border bg-surface px-4 py-2 hover:bg-surface-2"
              >
                <span className="text-[13px] font-bold text-text-strong">{s.title}</span>
                {s.distanceKm !== null && (
                  <span className="text-xs text-text-muted">
                    {s.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 max-w-[520px] text-sm text-text-subtle">
          {near.isError
            ? "Não foi possível carregar sugestões agora. Use os botões acima para continuar."
            : near.isPending && hasPlace
              ? "Buscando sugestões perto de você…"
              : hasPlace
                ? "Ainda não há sugestões para o seu local."
                : "Defina seu local no topo da página para ver sugestões perto de você."}
        </p>
      )}
    </SystemCard>
  );
}
