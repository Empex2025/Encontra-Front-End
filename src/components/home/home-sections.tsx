"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Flame, type LucideIcon, Tag, Utensils, Zap } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState } from "react";

import { EmptyBlock } from "./empty-block";
import { SectionHeader } from "./section-header";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { InlineError } from "@/components/ui/inline-state";
import { NeedLocation } from "@/components/ui/need-location";
import { ResultCard, ResultCardSkeleton, targetTypeOf } from "@/components/search/result-card";
import { useHomeData } from "@/hooks/use-home";
import { track } from "@/lib/analytics/track";
import {
  fetchHomeSection,
  HOME_TABS,
  type HomeItem,
  type HomeSectionId,
  SECTION_PAGE_SIZE,
} from "@/lib/api/home";
import { pageRange, seeAllHref } from "@/lib/domain/home-tabs";
import { routes } from "@/lib/routes";

type Meta = {
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** colunas do protótipo em 1280 px */
  grid: string;
  variant: "reel" | "auto";
  skeleton: "reel" | "auto" | "tall";
};

/** Títulos, subtítulos e grade de cada bloco (textos fixos do protótipo). */
const SECTIONS: Record<HomeSectionId, Meta> = {
  happening: {
    eyebrow: "Acontecendo perto de você",
    icon: Flame,
    title: "Promoções e ofertas agora",
    subtitle:
      "Lives, vídeos e ofertas das lojas e prestadores perto de você. Toque para assistir ou ver a oferta.",
    grid: "xl:grid-cols-6",
    variant: "reel",
    skeleton: "reel",
  },
  products: {
    eyebrow: "Produtos",
    icon: Tag,
    title: "Produtos relevantes perto de você",
    subtitle: "Preço, distância e por que aparece para você, num lugar só.",
    grid: "xl:grid-cols-5",
    variant: "auto",
    skeleton: "auto",
  },
  services: {
    eyebrow: "Serviços",
    icon: Zap,
    title: "Serviços relevantes perto de você",
    subtitle: "Profissionais do bairro com agenda, preço de referência e avaliações.",
    grid: "xl:grid-cols-5",
    variant: "auto",
    skeleton: "auto",
  },
  experiences: {
    eyebrow: "Experiências",
    icon: Utensils,
    title: "Bares, restaurantes, eventos",
    subtitle: "Onde comer, beber e passear perto de você, hoje.",
    grid: "xl:grid-cols-5",
    variant: "auto",
    skeleton: "tall",
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
          eyebrow={SECTIONS[id].eyebrow}
          icon={SECTIONS[id].icon}
          title={SECTIONS[id].title}
          subtitle={SECTIONS[id].subtitle}
          message={BLOCK_MESSAGE[mode]}
        />
      ))}
    </>
  );
}

/** Blocos de descoberta, na ordem do protótipo. Só mostra o que o servidor trouxe; sem itens, o bloco fica com estado vazio. */
export function HomeSections() {
  const { location, locLoading, hasPlace, query: home } = useHomeData();

  if (!locLoading && !hasPlace) {
    return (
      <div className="flex flex-col gap-10">
        <NeedLocation />
        <EmptyBlocks mode="no-place" />
      </div>
    );
  }

  if (locLoading || home.isPending) {
    return (
      <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-10">
        {ORDER.map((id) => (
          <section key={id} aria-labelledby={`home-${id}`} className="flex flex-col gap-4">
            <SectionHeader
              id={`home-${id}`}
              eyebrow={SECTIONS[id].eyebrow}
              icon={SECTIONS[id].icon}
              title={SECTIONS[id].title}
              subtitle={SECTIONS[id].subtitle}
            />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="w-60 shrink-0">
                  <ResultCardSkeleton variant={SECTIONS[id].skeleton} />
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
      <div className="flex flex-col gap-10">
        <ErrorState
          error={home.error}
          title="Não foi possível carregar a descoberta perto de você"
          onRetry={() => home.refetch()}
        />
        <EmptyBlocks mode="error" />
      </div>
    );
  }

  // Todos os blocos continuam na tela, na ordem do protótipo: o que veio sem itens mostra o estado vazio.
  const byId = new Map(home.data.sections.map((s) => [s.id, s]));
  const where = {
    lat: location.lat,
    lng: location.lng,
    where: location.label,
    radiusKm: location.radiusKm,
  };

  return (
    <div className="flex flex-col gap-10">
      {ORDER.map((id) => {
        const data = byId.get(id);
        if (!data || data.items.length === 0) return <EmptyBlocks key={id} mode="empty" only={[id]} />;
        return <Block key={id} id={id} initial={data} where={where} />;
      })}
    </div>
  );
}

function Block({
  id,
  initial,
  where,
}: {
  id: HomeSectionId;
  initial: { items: HomeItem[]; total: number };
  where: { lat: number | null; lng: number | null; where: string; radiusKm: number };
}) {
  const meta = SECTIONS[id];
  const size = SECTION_PAGE_SIZE[id];
  const tabs = HOME_TABS[id];
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  // A primeira página da aba "Tudo" já veio na resposta principal da Home; o resto vem do servidor, uma página por vez.
  const fromMain = tab === "all" && page === 1;
  const q = useQuery({
    queryKey: ["home-section", id, tab, page, where.lat, where.lng, where.where, where.radiusKm],
    queryFn: () => fetchHomeSection({ ...where, section: id, tab, page }),
    enabled: !fromMain,
    placeholderData: (prev) => prev,
    retry: false,
  });

  const items = fromMain ? initial.items.slice(0, size) : (q.data?.items ?? []);
  const total = fromMain ? initial.total : (q.data?.total ?? 0);
  const loading = !fromMain && q.isPending;
  const { first, last, hasPrev, hasNext } = pageRange(page, size, items.length, total);
  const titleId = `home-${id}`;

  const pick = (next: string) => {
    setTab(next);
    setPage(1);
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n =
      e.key === "ArrowRight"
        ? (i + 1) % tabs.length
        : e.key === "ArrowLeft"
          ? (i - 1 + tabs.length) % tabs.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? tabs.length - 1
              : -1;
    if (n < 0) return;
    e.preventDefault();
    pick(tabs[n].id);
    refs.current[tabs[n].id]?.focus();
  };

  const arrowCls =
    "flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text-strong hover:border-navy-300 disabled:opacity-40 disabled:hover:border-border";

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <SectionHeader
        id={titleId}
        eyebrow={meta.eyebrow}
        icon={meta.icon}
        title={meta.title}
        subtitle={meta.subtitle}
        aside={
          <div className="flex shrink-0 items-center gap-2">
            {total > 0 && items.length > 0 && (
              <span className="mr-1 text-xs text-text-subtle" aria-live="polite">
                {first}–{last} de {total}
              </span>
            )}
            <button
              type="button"
              aria-label="Anteriores"
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              className={arrowCls}
            >
              <ChevronLeft className="size-5" strokeWidth={2.4} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Próximos"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className={arrowCls}
            >
              <ChevronRight className="size-5" strokeWidth={2.4} aria-hidden />
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div role="tablist" aria-label={meta.title} className="flex flex-wrap gap-2">
          {tabs.map((t, i) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  refs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                id={`${base}-tab-${t.id}`}
                aria-selected={on}
                aria-controls={`${base}-panel`}
                tabIndex={on ? 0 : -1}
                onClick={() => pick(t.id)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  "h-[34px] rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
                  on
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface text-text-2 hover:border-navy-300",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <Link href={seeAllHref(id, tab)} className="py-1 text-sm font-semibold text-link hover:underline">
          Ver todos
        </Link>
      </div>

      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${tab}`}>
        {q.isError && !fromMain ? (
          <InlineError
            message="Não foi possível carregar esta aba agora."
            onRetry={() => void q.refetch()}
            retrying={q.isFetching}
          />
        ) : loading ? (
          <ul className={cn("flex gap-4 overflow-hidden xl:grid xl:gap-5", meta.grid)} aria-busy="true">
            {Array.from({ length: size }, (_, i) => (
              <li key={i} className="w-60 shrink-0 xl:w-auto">
                <ResultCardSkeleton variant={meta.skeleton} />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-6 text-sm text-text-muted">
            Nenhum item nesta aba perto de você agora.{" "}
            <Link href={routes.explorar} className="font-semibold text-link hover:underline">
              Buscar no Explorar
            </Link>
          </p>
        ) : (
          <ul
            className={cn(
              "-mx-4 flex snap-x items-start gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 xl:mx-0 xl:grid xl:gap-5 xl:overflow-visible xl:px-0 xl:pb-0",
              id === "happening" && "xl:gap-4",
              meta.grid,
            )}
          >
            {items.map((item, i) => (
              <li key={item.id} className="w-60 shrink-0 snap-start xl:w-auto">
                <ResultCard
                  item={item}
                  variant={meta.variant}
                  compare={false}
                  reason={item.reason?.label}
                  onOpen={() =>
                    track({
                      type: "SEARCH_RESULT_CLICK",
                      targetType: targetTypeOf(item),
                      targetId: item.id,
                      props: {
                        q: null,
                        position: first + i,
                        sponsored: item.sponsored,
                        source: `home:${id}${tab === "all" ? "" : `:${tab}`}`,
                      },
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
