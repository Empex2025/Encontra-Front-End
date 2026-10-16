"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import Link from "next/link";

import { useUserLocation } from "@/hooks/use-user-location";
import { discover, type StoryGroup } from "@/lib/api/discover";
import { formatKm, formatTimeAgo } from "@/lib/format";
import { liveHref, routes, storiesHref } from "@/lib/routes";

import { cn } from "@/components/ui/cn";
import { InlineError } from "@/components/ui/inline-state";

const cardCls = "flex flex-col gap-3.5 rounded-2xl bg-surface px-6 pt-[18px] pb-5 shadow-card";

function Heading() {
  return (
    <div className="flex items-center justify-between">
      <h2 id="home-stories" className="text-xl leading-7 font-bold text-text-strong">
        Stories
      </h2>
      <Link href={storiesHref({})} className="text-sm leading-5 font-bold text-accent-hover hover:underline">
        Ver todos
      </Link>
    </div>
  );
}

/** Texto pequeno sob o nome: quem você segue mostra "há 2 h"; os demais, a distância. */
function metaOf(g: StoryGroup) {
  if (g.highlight) return "Destaque";
  if (g.seen) return "visto";
  const last = g.stories.reduce((m, s) => (s.publishedAt > m ? s.publishedAt : m), g.stories[0].publishedAt);
  const ago = formatTimeAgo(last);
  if (g.following) return ago;
  return g.distanceKm !== null ? formatKm(g.distanceKm) : ago;
}

/**
 * Faixa de Stories da Home (protótipo): cartão branco, "Ver todos", o atalho "Perto agora" e os círculos das lojas.
 * Sem stories a seção continua visível com estado vazio (nada de círculos de enfeite).
 */
export function HomeStories() {
  const { location, isLoading } = useUserLocation();
  const hasPlace = location.lat !== null || location.label.trim().length > 0;
  const q = useQuery({
    queryKey: ["stories", "preview", location.lat, location.lng, location.radiusKm],
    queryFn: () =>
      discover.stories({ lat: location.lat, lng: location.lng, radiusKm: location.radiusKm, preview: true }),
    enabled: !isLoading && hasPlace,
    retry: false,
  });
  const groups = q.data?.groups ?? [];

  if (isLoading || (q.isPending && q.fetchStatus !== "idle")) {
    return (
      <section aria-labelledby="home-stories" className={cardCls}>
        <Heading />
        <div
          aria-busy="true"
          aria-label="Carregando stories"
          role="status"
          className="flex gap-4 overflow-hidden"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex w-[120px] shrink-0 flex-col items-center gap-2">
              <span className="size-28 animate-pulse rounded-[40px] bg-surface-2" />
              <span className="h-3 w-16 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (q.isError) {
    return (
      <section aria-labelledby="home-stories" className={cardCls}>
        <Heading />
        <InlineError
          message="Não foi possível carregar os stories agora."
          onRetry={() => void q.refetch()}
          retrying={q.isFetching}
        />
      </section>
    );
  }
  if (groups.length === 0) {
    return (
      <section aria-labelledby="home-stories" className={cardCls}>
        <Heading />
        <p className="rounded-xl border border-dashed border-border-strong px-5 py-6 text-sm text-text-muted">
          {hasPlace
            ? "Ainda não há stories perto de você. Quando as lojas publicarem, eles aparecem aqui."
            : "Defina seu local para ver os stories das lojas perto de você."}
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="home-stories" className={cardCls}>
      <Heading />
      <ul className="-mx-0.5 -my-1.5 flex items-start gap-4 overflow-x-auto px-0.5 pt-1.5 pb-5">
        <li className="w-[120px] shrink-0">
          <Link
            href={routes.explorar}
            aria-label="Ver o que está acontecendo perto de você"
            className="flex flex-col items-center gap-1.5 text-center transition-transform hover:-translate-y-0.5"
          >
            <span className="ring-pulse flex size-28 items-center justify-center rounded-[40px] bg-primary">
              <MapPin className="size-[38px] text-amber" aria-hidden />
            </span>
            <span className="mt-1.5 text-[13px] leading-[18px] font-bold text-text-strong">Perto agora</span>
            <span className="text-xs leading-4 text-text-subtle">no mapa</span>
          </Link>
        </li>
        <li aria-hidden className="mx-1 mt-1.5 mb-10 w-px self-stretch bg-surface-3" />
        {groups.slice(0, 9).map((g) => {
          const live = g.live ?? null;
          const ring = live
            ? "border-danger"
            : g.seen
              ? "border-border-strong"
              : g.following
                ? "border-accent"
                : "border-link";
          return (
            <li key={g.profile.id} className="w-[120px] shrink-0">
              <Link
                href={storiesHref({ inicio: g.profile.id })}
                aria-label={`Stories de ${g.profile.name}`}
                className="flex flex-col items-center gap-1.5 text-center transition-transform hover:-translate-y-0.5"
              >
                <span
                  className={cn(
                    "relative block size-28 rounded-[40px] border-[3px] bg-surface p-1",
                    g.seen ? "border-dashed" : "border-solid",
                    ring,
                  )}
                >
                  <span className="relative flex size-full items-center justify-center overflow-hidden rounded-[34px] bg-primary text-2xl font-bold text-on-primary">
                    {g.profile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- fotos de perfil vêm de armazenamento externo
                      <img
                        src={g.profile.avatarUrl}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      g.profile.name[0]
                    )}
                  </span>
                  {live && (
                    <span className="absolute -bottom-[7px] left-1/2 inline-flex h-6 -translate-x-1/2 items-center rounded-full border-2 border-surface bg-danger px-2 text-[10px] font-extrabold whitespace-nowrap text-white">
                      AO VIVO
                    </span>
                  )}
                  {g.stories.length > 1 && !g.seen && !live && (
                    <span className="absolute -top-[3px] -right-[3px] flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-surface bg-link px-[5px] text-[11px] font-extrabold text-white">
                      {g.stories.length}
                      <span className="sr-only"> stories</span>
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "mt-1.5 max-w-[120px] truncate text-[13px] leading-[18px] text-text",
                    g.seen ? "font-medium" : "font-bold",
                  )}
                >
                  {g.following && (
                    <span
                      title="Você segue"
                      className="mr-1 mb-px inline-block size-1.5 rounded-full bg-accent align-middle"
                    />
                  )}
                  {g.profile.name}
                </span>
                <span className="text-xs leading-4 text-text-subtle">{metaOf(g)}</span>
              </Link>
              {live && (
                <Link href={liveHref(live.id)} className="sr-only">
                  Assistir à live de {g.profile.name}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
