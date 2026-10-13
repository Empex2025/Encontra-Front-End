"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { BadgeCheck, Heart, MessageCircle, Play, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { ResultCard, ResultCardSkeleton, targetTypeOf } from "@/components/search/result-card";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { useUserLocation } from "@/hooks/use-user-location";
import { track } from "@/lib/analytics/track";
import { catalog, type Post, type Profile } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { CATEGORIES } from "@/lib/domain/categories";
import { markViewed } from "@/lib/domain/recently-viewed";
import { formatCount, formatKm, formatTimeAgo } from "@/lib/format";
import { avaliarHref, denunciarHref, lojaHref, prestadorHref, routes, storiesHref } from "@/lib/routes";
import { storeMessage } from "@/lib/domain/whatsapp";

import { Avatar } from "./avatar";
import { ContactButtons } from "./contact-buttons";
import { CouponCard } from "./coupon-card";
import { FollowButton } from "./follow-button";
import { ProviderBody } from "./provider-view";
import { ReviewsPanel } from "./reviews-panel";
import { ShareButton } from "./share-button";
import { StatusLine } from "./status-line";

/** Carrega o perfil e escolhe o layout: loja (/l) ou prestador (/s). Endereço trocado redireciona. */
export function ProfileView({ slug, expected }: { slug: string; expected: "store" | "provider" }) {
  const router = useRouter();
  const q = useQuery({
    queryKey: ["profile", slug],
    queryFn: () => catalog.profile(slug),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  const kind = q.data?.kind;
  useEffect(() => {
    if (kind && kind !== expected) router.replace(kind === "provider" ? prestadorHref(slug) : lojaHref(slug));
  }, [kind, expected, slug, router]);

  if (q.isPending) return <ProfileSkeleton />;
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFound />;
    return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  }
  if (q.data.kind !== expected) return <ProfileSkeleton />;
  return <ProfileContent profile={q.data} />;
}

function ProfileContent({ profile: p }: { profile: Profile }) {
  const [followers, setFollowers] = useState(p.followers);
  const isProvider = p.kind === "provider";
  const path = isProvider ? prestadorHref(p.slug) : lojaHref(p.slug);
  const target = { targetType: isProvider ? ("PROVIDER" as const) : ("STORE" as const), targetId: p.id };

  useEffect(() => {
    markViewed({ type: p.kind === "provider" ? "provider" : "store", slug: p.slug });
    track({ type: isProvider ? "SERVICE_VIEW" : "STORE_VIEW", ...target });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="h-32 bg-surface-2 sm:h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.coverUrl && <img src={p.coverUrl} alt="" className="size-full object-cover" />}
        </div>
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="-mt-14 flex items-end gap-4 sm:-mt-16">
            <span className="rounded-full bg-surface p-1 ring-2 ring-primary">
              <Avatar name={p.name} url={p.avatarUrl} size={88} />
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-text-strong">
              {p.name}
              {p.verification === "verified" && (
                <span className="bg-success-bg inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-success-text">
                  <BadgeCheck className="size-4" aria-hidden />
                  Verificado
                </span>
              )}
            </h1>
            <p className="text-sm text-text-muted">
              {[p.handle, p.categoryLabel].filter(Boolean).join(" · ")}
            </p>
            <StatusLine status={p.status} />
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Stat label="seguidores" value={formatCount(followers)} />
            <Stat
              label={isProvider ? "serviços" : "produtos"}
              value={formatCount(isProvider ? (p.provider?.services.length ?? 0) : p.stats.products)}
            />
            {!isProvider && <Stat label="posts" value={formatCount(p.stats.posts)} />}
            {p.stats.rating !== null && p.stats.reviewCount > 0 && (
              <Stat
                label={`(${p.stats.reviewCount} avaliações)`}
                value={`★ ${p.stats.rating.toFixed(1).replace(".", ",")}`}
              />
            )}
            {p.stats.respondsPct !== null && <Stat label="respondem" value={`${p.stats.respondsPct}%`} />}
          </dl>
          {p.bio && <p className="whitespace-pre-line text-text">{p.bio}</p>}
          {p.followedBy && p.followedBy.names.length > 0 && (
            <p className="text-sm text-text-muted">
              Seguido por {p.followedBy.names.join(", ")}
              {p.followedBy.others > 0 && ` e mais ${formatCount(p.followedBy.others)}`}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <FollowButton profile={p} withBell onFollowersChange={(d) => setFollowers((n) => n + d)} />
            <ShareButton
              path={path}
              title={p.name}
              noun={isProvider ? "prestador" : "loja"}
              report={denunciarHref(isProvider ? "prestador" : "loja", p.slug)}
              trackTarget={target}
            />
          </div>
          {!isProvider && (
            <ContactButtons
              profile={p}
              whatsappText={storeMessage(p.name)}
              chatLabel="Conversar com a loja"
              target={target}
            />
          )}
        </div>
      </div>

      {p.highlights.length > 0 && (
        <ul className="flex gap-4 overflow-x-auto pb-1" aria-label="Destaques">
          {p.highlights.map((h) => (
            <li key={h.id} className="w-20 shrink-0">
              <Link
                href={storiesHref({ perfil: p.slug, destaque: h.id })}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <span className={cn("rounded-full p-0.5", h.seen ? "bg-border" : "bg-primary")}>
                  <Avatar name={h.label} url={h.coverUrl} size={64} />
                </span>
                <span className="w-full truncate text-xs text-text-muted">{h.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {isProvider && p.provider ? (
        <ProviderBody profile={p} provider={p.provider} />
      ) : (
        <StoreTabs profile={p} />
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dd className="order-1 font-bold text-text-strong">{value}</dd>
      <dt className="order-2 text-text-muted">{label}</dt>
    </div>
  );
}

type TabId = "fotos" | "loja" | "ofertas" | "avaliacoes" | "sobre";

function StoreTabs({ profile: p }: { profile: Profile }) {
  const [tab, setTab] = useState<TabId>("loja");
  const tabs = [
    { id: "fotos", label: "Fotos e vídeos" },
    { id: "loja", label: "Loja", count: p.stats.products },
    { id: "ofertas", label: "Ofertas" },
    { id: "avaliacoes", label: "Avaliações", count: p.stats.reviewCount },
    { id: "sobre", label: "Sobre" },
  ];
  return (
    <section aria-label="Conteúdo da loja">
      <Tabs label="Seções da loja" value={tab} onChange={(v) => setTab(v as TabId)} tabs={tabs} />
      <TabPanel label={tabs.find((t) => t.id === tab)!.label}>
        {tab === "fotos" && <PostsGrid slug={p.slug} />}
        {tab === "loja" && <StoreProducts slug={p.slug} />}
        {tab === "ofertas" && <StoreOffers slug={p.slug} onSeeStore={() => setTab("loja")} />}
        {tab === "avaliacoes" && (
          <ReviewsPanel
            target="profiles"
            slug={p.slug}
            reviewHref={avaliarHref("loja", p.slug)}
            reviewLabel="Avaliar esta loja"
          />
        )}
        {tab === "sobre" && <AboutStore profile={p} />}
      </TabPanel>
    </section>
  );
}

function PostsGrid({ slug }: { slug: string }) {
  const [open, setOpen] = useState<Post | null>(null);
  const q = useInfiniteQuery({
    queryKey: ["profile", slug, "posts"],
    queryFn: ({ pageParam }) => catalog.posts(slug, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
  if (q.isPending) return <p className="text-text-muted">Carregando…</p>;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const posts = q.data.pages.flatMap((pg) => pg.items);
  if (posts.length === 0)
    return <p className="py-8 text-center text-text-muted">A loja ainda não publicou fotos ou vídeos.</p>;
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {posts.map((post) => (
          <li key={post.id}>
            <button
              type="button"
              onClick={() => setOpen(post)}
              aria-label={post.caption ?? "Abrir publicação"}
              className="relative block aspect-square w-full overflow-hidden rounded-lg bg-surface-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.type === "video" ? (post.posterUrl ?? "") : post.url}
                alt=""
                className="size-full object-cover"
              />
              {post.type === "video" && (
                <Play
                  className="absolute top-2 right-2 size-5 fill-white text-white drop-shadow"
                  aria-hidden
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      {q.hasNextPage && (
        <button
          type="button"
          disabled={q.isFetchingNextPage}
          onClick={() => q.fetchNextPage()}
          className="self-center rounded-lg border border-border-strong px-5 py-2.5 text-sm font-bold"
        >
          {q.isFetchingNextPage ? "Carregando…" : "Ver mais"}
        </button>
      )}
      {open && <PostViewer post={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function PostViewer({ post, onClose }: { post: Post; onClose: () => void }) {
  return (
    <Modal title={post.caption ?? "Publicação"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {post.type === "video" ? (
          <video
            src={post.url}
            poster={post.posterUrl ?? undefined}
            controls
            className="max-h-[70vh] w-full rounded-lg bg-black"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.url}
            alt={post.caption ?? ""}
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        )}
        {post.caption && <p className="text-text">{post.caption}</p>}
        <p className="flex items-center gap-3 text-sm text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-4" aria-hidden />
            {formatCount(post.likes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-4" aria-hidden />
            {formatCount(post.comments)}
          </span>
          <span>{formatTimeAgo(post.createdAt)}</span>
        </p>
        {post.product && (
          <Link
            href={`/p/${encodeURIComponent(post.product.slug)}`}
            className="rounded-lg bg-surface-2 p-3 text-sm font-semibold text-link hover:underline"
          >
            Ver produto: {post.product.title}
          </Link>
        )}
      </div>
    </Modal>
  );
}

const SORTS = [
  { id: "best_selling", label: "Mais vendidos" },
  { id: "price_asc", label: "Menor preço" },
  { id: "price_desc", label: "Maior preço" },
] as const;

function StoreProducts({ slug }: { slug: string }) {
  const { location } = useUserLocation();
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("best_selling");
  const [cat, setCat] = useState<string | undefined>();

  useEffect(() => {
    const t = setTimeout(() => setQ(term.trim()), 350);
    return () => clearTimeout(t);
  }, [term]);

  const query = useInfiniteQuery({
    queryKey: ["profile", slug, "products", q, sort, cat, location.lat, location.lng],
    queryFn: ({ pageParam }) =>
      catalog.profileProducts(slug, { q, sort, cat, page: pageParam, lat: location.lat, lng: location.lng }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
  const items = query.data?.pages.flatMap((pg) => pg.items) ?? [];
  const cats = Object.entries(query.data?.pages[0]?.facets.categories ?? {}).filter(([, n]) => n > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar nesta loja</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-subtle"
            aria-hidden
          />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar nesta loja"
            className="h-11 w-full rounded-lg border border-border-strong bg-surface pr-3 pl-9 text-text"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          Ordenar
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-text"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {cats.length > 1 && (
        <ul className="flex flex-wrap gap-2" aria-label="Categorias da loja">
          <li>
            <button
              type="button"
              aria-pressed={!cat}
              onClick={() => setCat(undefined)}
              className={chip(!cat)}
            >
              Todas
            </button>
          </li>
          {cats.map(([id, n]) => (
            <li key={id}>
              <button
                type="button"
                aria-pressed={cat === id}
                onClick={() => setCat(id)}
                className={chip(cat === id)}
              >
                {CATEGORIES.find((c) => c.id === id)?.name ?? id} ({n})
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.isPending ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <ResultCardSkeleton key={i} />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-text-muted">
          {q || cat ? "Nenhum produto com esse filtro nesta loja." : "A loja ainda não cadastrou produtos."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <li key={item.id}>
              <ResultCard
                item={item}
                onOpen={() =>
                  track({
                    type: "SEARCH_RESULT_CLICK",
                    targetType: targetTypeOf(item),
                    targetId: item.id,
                    props: {
                      q: q || null,
                      position: i + 1,
                      sponsored: item.sponsored,
                      source: "profile:products",
                    },
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
      {query.hasNextPage && (
        <button
          type="button"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
          className="self-center rounded-lg border border-border-strong px-5 py-2.5 text-sm font-bold"
        >
          {query.isFetchingNextPage ? "Carregando…" : "Ver mais produtos"}
        </button>
      )}
    </div>
  );
}

const chip = (on: boolean) =>
  cn(
    "h-10 rounded-full border px-4 text-sm font-semibold",
    on
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-text hover:bg-surface-2",
  );

function StoreOffers({ slug, onSeeStore }: { slug: string; onSeeStore: () => void }) {
  const q = useQuery({ queryKey: ["profile", slug, "offers"], queryFn: () => catalog.offers(slug) });
  if (q.isPending) return <p className="text-text-muted">Carregando…</p>;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const o = q.data;
  const empty = !o.coupon && !o.live && o.upcomingLives.length === 0 && !o.event && o.promoCount === 0;
  if (empty)
    return <p className="py-8 text-center text-text-muted">Nenhuma oferta ativa desta loja agora.</p>;
  return (
    <div className="flex flex-col gap-4">
      {o.coupon && <CouponCard coupon={o.coupon} />}
      {o.live && (
        <Link
          href={`/ao-vivo/${encodeURIComponent(o.live.id)}`}
          className="rounded-xl border border-border p-4 hover:bg-surface-2"
        >
          <span className="font-bold text-text-strong">🔴 Ao vivo agora: {o.live.title}</span>
          <span className="block text-sm text-text-muted">{formatCount(o.live.viewers)} assistindo</span>
        </Link>
      )}
      {o.upcomingLives.map((l) => (
        <p key={l.id} className="rounded-xl border border-border p-4 text-sm">
          <b>{l.title}</b> ·{" "}
          {new Date(l.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </p>
      ))}
      {o.event && (
        <Link
          href={`/eventos/${encodeURIComponent(o.event.id)}`}
          className="rounded-xl border border-border p-4 hover:bg-surface-2"
        >
          <span className="font-bold text-text-strong">{o.event.title}</span>
          {o.event.place && <span className="block text-sm text-text-muted">{o.event.place}</span>}
        </Link>
      )}
      {o.promoCount > 0 && (
        <button
          type="button"
          onClick={onSeeStore}
          className="self-start text-sm font-bold text-link hover:underline"
        >
          {o.promoCount} {o.promoCount === 1 ? "produto em promoção" : "produtos em promoção"} nesta loja →
        </button>
      )}
    </div>
  );
}

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function AboutStore({ profile: p }: { profile: Profile }) {
  const today = new Date().getDay();
  const a = p.address;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-text-strong">Horário</h2>
        {p.hours.length === 0 ? (
          <p className="text-text-muted">A loja não informou o horário.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {p.hours.map((h) => (
              <li
                key={h.day}
                className={cn(
                  "flex justify-between rounded-md px-3 py-1.5",
                  h.day === today && "bg-surface-2 font-bold",
                )}
              >
                <span>{DAYS[h.day]}</span>
                <span>{h.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-text-strong">Endereço</h2>
        {a ? (
          <>
            <p className="text-text">
              {[a.street, a.neighborhood, a.city].filter(Boolean).join(", ") || "Endereço não informado"}
            </p>
            {a.distanceKm !== null && (
              <p className="text-sm text-text-muted">{formatKm(a.distanceKm)} de você</p>
            )}
            {a.lat !== null && a.lng !== null && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track({ type: "ROUTE_REQUESTED", targetType: "STORE", targetId: p.id })}
                className="self-start rounded-lg border border-primary px-4 py-2.5 text-sm font-bold text-text-strong hover:bg-surface-2"
              >
                Como chegar
              </a>
            )}
          </>
        ) : (
          <p className="text-text-muted">A loja não informou o endereço.</p>
        )}
      </section>
      {(p.badges.length > 0 || p.payment.length > 0) && (
        <section className="flex flex-col gap-2 md:col-span-2">
          {p.badges.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {p.badges.map((b) => (
                <li key={b} className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-text-2">
                  {b}
                </li>
              ))}
            </ul>
          )}
          {p.payment.length > 0 && (
            <p className="text-sm text-text-muted">
              Formas de pagamento combinadas direto com a loja: {p.payment.join(", ")}.
            </p>
          )}
          <p className="text-xs text-text-subtle">
            {p.since.business ? `Na praça desde ${p.since.business}. ` : ""}
            {p.since.platform ? `Na EncontraÊ desde ${p.since.platform}. ` : ""}
            {p.cnpjVerified ? "CNPJ verificado." : ""}
          </p>
        </section>
      )}
      <p className="md:col-span-2">
        <Link
          href={denunciarHref("loja", p.slug)}
          className="text-sm font-semibold text-link hover:underline"
        >
          Denunciar esta loja
        </Link>
      </p>
    </div>
  );
}

export function SimilarProfiles({ profile }: { profile: Profile }) {
  const q = useQuery({
    queryKey: ["profile", profile.slug, "similar"],
    queryFn: () => catalog.similar(profile.slug),
  });
  if (q.isPending || q.isError || q.data.items.length === 0) return null;
  const name = profile.categoryLabel ?? "profissionais";
  return (
    <section aria-labelledby="similar-title" className="flex flex-col gap-3">
      <h2 id="similar-title" className="text-xl font-bold text-text-strong">
        Outros {name} perto de você
      </h2>
      <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-3">
        {q.data.items.slice(0, 3).map((item) => (
          <li key={item.id}>
            <ResultCard item={item} />
          </li>
        ))}
      </ul>
      <Link href={routes.explorar} className="self-start text-sm font-semibold text-link hover:underline">
        Ver todos no Explorar
      </Link>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando perfil"
      className="mx-auto flex w-full max-w-5xl animate-pulse flex-col gap-4"
    >
      <div className="h-48 rounded-2xl bg-surface-2" />
      <div className="h-8 w-1/2 rounded bg-surface-2" />
      <div className="h-24 rounded bg-surface-2" />
    </div>
  );
}

function NotFound() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-bold text-text-strong">Perfil não encontrado</h1>
      <p className="text-text-muted">Ele pode ter sido removido ou o endereço está incorreto.</p>
      <Link
        href={routes.explorar}
        className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-hover"
      >
        Buscar no Explorar
      </Link>
    </section>
  );
}
