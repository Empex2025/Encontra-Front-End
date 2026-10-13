"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useUserLocation } from "@/hooks/use-user-location";
import { discover } from "@/lib/api/discover";
import { storiesHref } from "@/lib/routes";

import { cn } from "@/components/ui/cn";

/** Faixa de Stories da Home. Sem local, sem stories ou com erro, a faixa some (nada de círculos de enfeite). */
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
  if (groups.length === 0) return null;
  return (
    <section aria-label="Stories perto de você" className="flex flex-col gap-2">
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
