"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useUserLocation } from "@/hooks/use-user-location";
import { discover } from "@/lib/api/discover";
import { storiesHref } from "@/lib/routes";

import { cn } from "@/components/ui/cn";
import { InlineError } from "@/components/ui/inline-state";
import { EmptyBlock } from "./empty-block";

/** Faixa de Stories da Home. Sem stories a seção continua visível com estado vazio (nada de círculos de enfeite). */
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
  const subtitle = "Novidades das lojas perto de você, por 24 horas";
  if (isLoading || (q.isPending && q.fetchStatus !== "idle")) {
    return (
      <section aria-labelledby="home-stories" className="flex flex-col gap-3">
        <StoriesHeading subtitle={subtitle} />
        <div
          aria-busy="true"
          aria-label="Carregando stories"
          role="status"
          className="flex gap-4 overflow-hidden"
        >
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex w-20 shrink-0 flex-col items-center gap-1.5">
              <span className="size-[72px] animate-pulse rounded-full bg-surface-2" />
              <span className="h-3 w-14 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (q.isError) {
    return (
      <section aria-labelledby="home-stories" className="flex flex-col gap-3">
        <StoriesHeading subtitle={subtitle} />
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
      <EmptyBlock
        id="home-stories"
        title="Stories"
        subtitle={subtitle}
        message={
          hasPlace
            ? "Ainda não há stories perto de você. Quando as lojas publicarem, eles aparecem aqui."
            : "Defina seu local para ver os stories das lojas perto de você."
        }
      >
        <Link href={storiesHref({})} className="text-sm font-semibold text-link hover:underline">
          Abrir os stories
        </Link>
      </EmptyBlock>
    );
  }
  return (
    <section aria-labelledby="home-stories" className="flex flex-col gap-3">
      <StoriesHeading subtitle={subtitle} />
      <ul className="flex gap-4 overflow-x-auto pb-1">
        {groups.slice(0, 7).map((g) => (
          <li key={g.profile.id} className="w-20 shrink-0">
            <Link
              href={storiesHref({ inicio: g.profile.id })}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <span className={cn("rounded-full p-0.5", g.seen ? "bg-border" : "bg-accent")}>
                <span className="flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-bg bg-primary text-lg font-bold text-on-primary">
                  {g.profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.profile.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    g.profile.name[0]
                  )}
                </span>
              </span>
              <span className="w-full truncate text-xs text-text-muted">{g.profile.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StoriesHeading({ subtitle }: { subtitle: string }) {
  return (
    <div>
      <h2 id="home-stories" className="text-xl font-bold text-text-strong">
        Stories
      </h2>
      <p className="text-sm text-text-muted">{subtitle}</p>
    </div>
  );
}
