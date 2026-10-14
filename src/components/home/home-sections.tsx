"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { EmptyBlock } from "./empty-block";
import { ErrorState } from "@/components/ui/error-state";
import { NeedLocation } from "@/components/ui/need-location";
import { ResultCard, ResultCardSkeleton, targetTypeOf } from "@/components/search/result-card";
import { useUserLocation } from "@/hooks/use-user-location";
import { track } from "@/lib/analytics/track";
import { fetchHome, type HomeSectionId } from "@/lib/api/home";
import { explorarHref } from "@/lib/domain/search-state";
import { routes } from "@/lib/routes";

/** Títulos e destino de "Ver todos" de cada bloco (textos fixos do documento). */
const SECTIONS: Record<HomeSectionId, { title: string; subtitle: string; href: string }> = {
  happening: {
    title: "Acontecendo perto de você",
    subtitle: "Ao vivo, promoções e ofertas agora",
    href: explorarHref({ q: "", lens: "offers", specialty: [], sort: "relevance" }),
  },
  products: {
    title: "Produtos",
    subtitle: "Produtos relevantes perto de você",
    href: routes.explorar,
  },
  services: {
    title: "Serviços",
    subtitle: "Serviços relevantes perto de você",
    href: explorarHref({ q: "", cat: "servicos", specialty: [], sort: "relevance" }),
  },
  experiences: {
    title: "Experiências",
    subtitle: "Bares, restaurantes, eventos",
    href: explorarHref({ q: "", cat: "bares", specialty: [], sort: "relevance" }),
  },
};
const ORDER: HomeSectionId[] = ["happening", "products", "services", "experiences"];

type BlockMode = "no-place" | "empty" | "error" | "loading";

const BLOCK_MESSAGE: Record<BlockMode, string> = {
  "no-place": "Defina seu local para ver o que está perto de você.",
  empty: "Ainda não há itens aqui. Amplie o raio ou busque por algo específico.",
  error: "Não foi possível carregar este bloco agora.",
  loading: "Carregando…",
};

function EmptyBlocks({ mode, only }: { mode: BlockMode; only?: HomeSectionId[] }) {
  return (
    <>
      {(only ?? ORDER).map((id) => (
        <EmptyBlock
          key={id}
          id={`home-${id}`}
          title={SECTIONS[id].title}
          subtitle={SECTIONS[id].subtitle}
          message={BLOCK_MESSAGE[mode]}
        />
      ))}
    </>
  );
}

/** Blocos de descoberta. Só mostra o que o servidor trouxe; sem itens, o bloco fica com estado vazio (nunca preenchido à mão). */
export function HomeSections() {
  const { location, isLoading: locLoading } = useUserLocation();
  const hasPlace = location.lat !== null || location.label.trim().length > 0;

  const home = useQuery({
    queryKey: ["home", location.lat, location.lng, location.label, location.radiusKm],
    queryFn: () =>
      fetchHome({ lat: location.lat, lng: location.lng, where: location.label, radiusKm: location.radiusKm }),
    enabled: !locLoading && hasPlace,
  });

  if (!locLoading && !hasPlace) {
    return (
      <div className="flex flex-col gap-8">
        <NeedLocation />
        <EmptyBlocks mode="no-place" />
      </div>
    );
  }

  if (locLoading || home.isPending) {
    return (
      <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-8">
        {ORDER.map((id) => (
          <section key={id} aria-labelledby={`home-${id}`} className="flex flex-col gap-3">
            <div>
              <h2 id={`home-${id}`} className="text-xl font-bold text-text-strong">
                {SECTIONS[id].title}
              </h2>
              <p className="text-sm text-text-muted">{SECTIONS[id].subtitle}</p>
            </div>
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="w-64 shrink-0">
                  <ResultCardSkeleton />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (home.isError) {
    return (
      <div className="flex flex-col gap-8">
        <ErrorState
          error={home.error}
          title="Não foi possível carregar a descoberta perto de você"
          onRetry={() => home.refetch()}
        />
        <EmptyBlocks mode="error" />
      </div>
    );
  }

  // Todos os blocos continuam na tela, na ordem do documento: o que veio sem itens mostra o estado vazio.
  const byId = new Map(home.data.sections.map((s) => [s.id, s]));
  const hasItems = (id: HomeSectionId) => (byId.get(id)?.items.length ?? 0) > 0;
  if (!ORDER.some(hasItems)) return <EmptyBlocks mode="empty" />;

  return (
    <div className="flex flex-col gap-8">
      {ORDER.map((id) => {
        const data = byId.get(id);
        if (!data || data.items.length === 0) return <EmptyBlocks key={id} mode="empty" only={[id]} />;
        const meta = SECTIONS[id];
        const titleId = `home-${id}`;
        return (
          <section key={id} aria-labelledby={titleId} className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-xl font-bold text-text-strong">
                  {meta.title}
                </h2>
                <p className="text-sm text-text-muted">{meta.subtitle}</p>
              </div>
              <Link
                href={meta.href}
                className="shrink-0 py-2 text-sm font-semibold text-link hover:underline"
              >
                Ver todos{data.total > data.items.length ? ` (${data.total})` : ""}
              </Link>
            </div>
            <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {data.items.map((item, i) => (
                <li key={item.id} className="w-64 shrink-0 snap-start">
                  <ResultCard
                    item={item}
                    reason={item.reason?.label}
                    onOpen={() =>
                      track({
                        type: "SEARCH_RESULT_CLICK",
                        targetType: targetTypeOf(item),
                        targetId: item.id,
                        props: { q: null, position: i + 1, sponsored: item.sponsored, source: `home:${id}` },
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
