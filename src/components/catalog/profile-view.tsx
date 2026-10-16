"use client";

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Check,
  Eye,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Play,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { ResultCard, ResultCardSkeleton, targetTypeOf } from "@/components/search/result-card";
import { WantDialog } from "@/components/search/want-dialog";
import { cn } from "@/components/ui/cn";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useUserLocation } from "@/hooks/use-user-location";
import { track } from "@/lib/analytics/track";
import { actions } from "@/lib/api/actions";
import { catalog, type Post, type Profile } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { CATEGORIES } from "@/lib/domain/categories";
import { routeUrl } from "@/lib/domain/offer";
import { markViewed } from "@/lib/domain/recently-viewed";
import { cnpjSignal, textSignal, updatedSignal, verificationSignal } from "@/lib/domain/trust";
import { storeMessage, whatsappUrl } from "@/lib/domain/whatsapp";
import { formatCount, formatInt, formatKm, formatTimeAgo } from "@/lib/format";
import {
  avaliarHref,
  conversaHref,
  denunciarHref,
  liveHref,
  lojaHref,
  prestadorHref,
  routes,
  storiesHref,
} from "@/lib/routes";

import { Avatar } from "./avatar";
import { CouponCard } from "./coupon-card";
import { FollowButton } from "./follow-button";
import { ProviderPage } from "./provider-view";
import { ReviewsPanel } from "./reviews-panel";
import { BlockSkeleton, CardsSkeleton, EmptyNote, PageError, Section, SectionError } from "./section-state";
import { ShareButton } from "./share-button";
import { StatusLine } from "./status-line";
import { TrustSignals } from "./trust-signals";

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
    return (
      <PageError
        what={expected === "provider" ? "o prestador" : "a loja"}
        error={q.error}
        onRetry={() => q.refetch()}
        backHref={routes.explorar}
        backLabel="Buscar no Explorar"
      />
    );
  }
  if (q.data.kind !== expected) return <ProfileSkeleton />;
  return q.data.kind === "provider" ? <ProviderPage profile={q.data} /> : <StorePage profile={q.data} />;
}

/** "Voltar" do topo das telas de perfil (loja e prestador). */
export function BackLink({ label = "Voltar" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-link hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </button>
  );
}

/** Botão "Conversar" do cabeçalho (chat próprio; visitante vê o convite para entrar). */
export function ChatPill({
  profileId,
  serviceId,
  label = "Conversar",
  className,
  look = "pill",
}: {
  profileId: string;
  serviceId?: string;
  label?: string;
  className?: string;
  /** `pill`: redondo (perfil da loja); `outline`: retângulo de 40 px com borda azul (prestador); `solid`: faixa azul cheia (aba Sobre). */
  look?: "pill" | "outline" | "solid";
}) {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const chat = useMutation({
    mutationFn: () => actions.startConversation({ profileId, serviceId }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });
  return (
    <button
      type="button"
      disabled={chat.isPending}
      onClick={() => {
        if (!requireAuth("chat", profileId)) return;
        chat.mutate();
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 text-sm font-bold whitespace-nowrap disabled:opacity-60",
        look === "pill" &&
          "h-[38px] rounded-full border border-border bg-surface px-[18px] text-text-strong hover:bg-surface-2",
        look === "outline" &&
          "h-10 rounded-lg border-[1.5px] border-primary bg-surface px-4 text-text-strong hover:bg-surface-2",
        look === "solid" && "h-11 w-full rounded-full bg-primary px-5 text-on-primary hover:bg-primary-hover",
        className,
      )}
    >
      <MessageCircle className="size-4" aria-hidden />
      {chat.isPending ? "Abrindo…" : label}
    </button>
  );
}

type TabId = "fotos" | "loja" | "ofertas" | "avaliacoes" | "sobre";

function StorePage({ profile: p }: { profile: Profile }) {
  const [tab, setTab] = useState<TabId>("fotos");
  const path = lojaHref(p.slug);
  const target = { targetType: "STORE" as const, targetId: p.id };

  useEffect(() => {
    markViewed({ type: "store", slug: p.slug });
    track({ type: "STORE_VIEW", ...target });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  const go = (t: TabId) => {
    setTab(t);
    document.getElementById("perfil-abas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <article className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
      <BackLink />
      <StoreHeader profile={p} path={path} target={target} onGo={go} />
      <StoreTabBar profile={p} tab={tab} onChange={setTab} />
      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-5">
        <div role="tabpanel" aria-label={tabLabel(tab)} tabIndex={0} className="outline-none">
          {tab === "fotos" && <PostsGrid slug={p.slug} />}
          {tab === "loja" && <StoreProducts slug={p.slug} />}
          {tab === "ofertas" && <StoreOffers profile={p} onSeeStore={() => setTab("loja")} />}
          {tab === "avaliacoes" && (
            <div className="rounded-2xl bg-surface p-4 shadow-card sm:p-6">
              <ReviewsPanel
                target="profiles"
                slug={p.slug}
                reviewHref={avaliarHref("loja", p.slug)}
                reviewLabel="Avaliar esta loja"
              />
            </div>
          )}
          {tab === "sobre" && <AboutStore profile={p} />}
        </div>
        <SimilarProfiles profile={p} />
      </div>
    </article>
  );
}

const TAB_LABELS: Record<TabId, string> = {
  fotos: "Fotos e vídeos",
  loja: "Loja",
  ofertas: "Ofertas",
  avaliacoes: "Avaliações",
  sobre: "Sobre",
};
const tabLabel = (t: TabId) => TAB_LABELS[t];

function StoreHeader({
  profile: p,
  path,
  target,
  onGo,
}: {
  profile: Profile;
  path: string;
  target: { targetType: "STORE"; targetId: string };
  onGo: (t: TabId) => void;
}) {
  const [followers, setFollowers] = useState(p.followers);
  const place = [p.address?.neighborhood, p.address?.city].filter(Boolean).join(", ");
  const hasStories = p.highlights.length > 0;
  const ring = p.live ? "border-danger" : p.following ? "border-accent" : "border-border";
  const avatar = (
    <span
      className={cn(
        "relative flex size-[104px] items-center justify-center rounded-[34px] border-4 bg-surface p-1 sm:size-[140px] sm:rounded-[48px] sm:p-[5px]",
        ring,
      )}
    >
      <Avatar
        name={p.name}
        url={p.avatarUrl}
        size={120}
        tone="navy"
        className="!size-full !rounded-[28px] sm:!rounded-[40px]"
      />
      {p.live && (
        <span className="absolute bottom-[-14px] left-1/2 inline-flex h-[22px] -translate-x-1/2 items-center rounded-full border-2 border-surface bg-danger px-[9px] text-[11px] font-extrabold tracking-[.4px] whitespace-nowrap text-white">
          AO VIVO
        </span>
      )}
    </span>
  );

  const rating: { n: string; l: string; go: TabId | null; star?: boolean } =
    p.stats.rating !== null && p.stats.reviewCount > 0
      ? {
          n: p.stats.rating.toFixed(1).replace(".", ","),
          l: `${formatInt(p.stats.reviewCount)} avaliações`,
          go: "avaliacoes",
          star: true,
        }
      : { n: "—", l: "avaliações", go: "avaliacoes" };
  const stats: { n: string; l: string; go: TabId | null; star?: boolean }[] = [
    rating,
    { n: formatCount(followers), l: "seguidores", go: null },
    { n: formatCount(p.stats.products), l: "produtos", go: "loja" },
    { n: formatCount(p.stats.posts), l: "publicações", go: "fotos" },
    { n: p.stats.respondsPct !== null ? `${p.stats.respondsPct}%` : "—", l: "responde no chat", go: null },
  ];

  return (
    <section aria-label="Perfil da loja" className="relative rounded-t-[20px] bg-surface pb-1 shadow-card">
      <div className="relative h-36 overflow-hidden rounded-t-[20px] bg-navy sm:h-[230px]">
        {p.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- capa enviada pela loja
          <img src={p.coverUrl} alt="" className="absolute inset-0 size-full object-cover opacity-90" />
        )}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-navy/55"
        />
        {p.live && (
          <Link
            href={liveHref(p.live.id)}
            className="absolute top-5 right-5 inline-flex h-9 items-center gap-2 rounded-full bg-danger px-3.5 text-[13px] font-extrabold text-white shadow-raised"
          >
            <span className="size-2 rounded-full bg-white" aria-hidden />
            AO VIVO agora · {formatCount(p.live.viewers)}
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 pb-6 sm:flex-row sm:gap-6 sm:px-7">
        <div className="relative z-[2] -mt-12 shrink-0 sm:-mt-[66px]">
          {hasStories ? (
            <Link href={storiesHref({ perfil: p.slug })} aria-label="Ver stories da loja">
              {avatar}
            </Link>
          ) : (
            avatar
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:pt-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <h1 className="text-[28px] leading-9 font-extrabold text-text-strong">{p.name}</h1>
              {p.verification === "verified" && (
                <span title="Loja verificada" className="inline-flex text-link">
                  <BadgeCheck className="size-6 fill-link text-surface" aria-label="Loja verificada" />
                </span>
              )}
              {p.categoryLabel && (
                <span className="inline-flex h-[26px] items-center rounded-full bg-selected px-2.5 text-xs font-bold text-text-strong">
                  {p.categoryLabel}
                </span>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:ml-3">
                <FollowButton
                  profile={p}
                  variant="pill"
                  withBell
                  onFollowersChange={(d) => setFollowers((n) => n + d)}
                />
                <ChatPill profileId={p.id} />
                <ShareButton
                  variant="menu"
                  path={path}
                  title={p.name}
                  noun="loja"
                  report={denunciarHref("loja", p.slug)}
                  trackTarget={target}
                />
              </div>
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm leading-5 text-text-muted">
              {p.handle && (
                <>
                  <span>{p.handle}</span>
                  <span aria-hidden>·</span>
                </>
              )}
              <StatusLine status={p.status} />
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4 text-accent-hover" aria-hidden />
                {p.address?.distanceKm != null ? formatKm(p.address.distanceKm) : "Distância indisponível"}
                {place && ` · ${place}`}
              </span>
            </p>
          </div>

          <dl className="flex flex-wrap items-center gap-x-7 gap-y-3 py-1">
            {stats.map((s) => {
              const body = (
                <>
                  <dd className="inline-flex items-center gap-1 text-lg leading-6 font-extrabold text-text-strong">
                    {s.star && <Star className="size-4 fill-accent text-accent" aria-hidden />}
                    {s.n}
                  </dd>
                  <dt className="text-xs leading-4 text-text-muted">{s.l}</dt>
                </>
              );
              return s.go ? (
                <button
                  key={s.l}
                  type="button"
                  onClick={() => onGo(s.go!)}
                  className="flex flex-col items-start text-left"
                >
                  {body}
                </button>
              ) : (
                <div key={s.l} className="flex flex-col items-start">
                  {body}
                </div>
              );
            })}
          </dl>

          {p.bio ? (
            <p className="max-w-[760px] text-sm leading-[21px] whitespace-pre-line text-text-2">{p.bio}</p>
          ) : (
            <p className="text-sm text-text-muted">A loja ainda não escreveu uma apresentação.</p>
          )}

          {p.followedBy && p.followedBy.names.length > 0 && (
            <p className="inline-flex items-center gap-2 text-[13px] text-text-2">
              <span className="inline-flex" aria-hidden>
                {p.followedBy.names.slice(0, 2).map((n, i) => (
                  <Avatar
                    key={n}
                    name={n}
                    url={null}
                    size={24}
                    shape="circle"
                    tone="navy"
                    className={cn("border-2 border-surface", i > 0 && "-ml-2")}
                  />
                ))}
              </span>
              <span>
                Seguida por <b className="text-text">{p.followedBy.names.join(", ")}</b>
                {p.followedBy.others > 0 &&
                  ` e mais ${formatCount(p.followedBy.others)} pessoas que você segue`}
              </span>
            </p>
          )}
        </div>
      </div>

      {hasStories ? (
        <ul
          aria-label="Destaques"
          className="flex justify-start gap-[22px] overflow-x-auto px-4 pb-[42px] sm:justify-center sm:px-7"
        >
          {p.highlights.map((h) => (
            <li key={h.id} className="w-[76px] shrink-0">
              <Link
                href={storiesHref({ perfil: p.slug, destaque: h.id })}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <span
                  className={cn(
                    "box-border size-[72px] rounded-[26px] border-[3px] bg-surface p-[3px]",
                    h.seen ? "border-primary" : "border-accent",
                  )}
                >
                  <span className="block size-full overflow-hidden rounded-[20px] bg-navy">
                    {h.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- capa do destaque
                      <img src={h.coverUrl} alt="" className="size-full object-cover" />
                    )}
                  </span>
                </span>
                <span className="w-full truncate text-xs leading-4 font-semibold text-text">{h.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 pb-[42px] text-center text-sm text-text-muted sm:px-7">
          A loja ainda não publicou destaques.
        </p>
      )}
    </section>
  );
}

function StoreTabBar({
  profile: p,
  tab,
  onChange,
}: {
  profile: Profile;
  tab: TabId;
  onChange: (t: TabId) => void;
}) {
  const tabs: { id: TabId; count?: number }[] = [
    { id: "fotos", count: p.stats.posts },
    { id: "loja", count: p.stats.products },
    { id: "ofertas" },
    { id: "avaliacoes", count: p.stats.reviewCount },
    { id: "sobre" },
  ];
  return (
    <nav
      id="perfil-abas"
      role="tablist"
      aria-label="Seções da loja"
      className="sticky top-16 z-20 -mt-5 flex justify-start gap-1 overflow-x-auto rounded-b-[20px] border-t border-surface-3 bg-surface px-3 shadow-card sm:justify-center sm:gap-2 sm:px-7 lg:top-[84px]"
    >
      {tabs.map((t) => {
        const on = t.id === tab;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "inline-flex h-[52px] shrink-0 items-center gap-1.5 border-t-[3px] px-4 text-sm font-bold whitespace-nowrap sm:px-[22px]",
              on ? "border-accent text-text-strong" : "border-transparent text-text-muted hover:text-text",
            )}
          >
            {TAB_LABELS[t.id]}
            {t.count != null && (
              <span className="text-xs font-semibold opacity-70">{formatCount(t.count)}</span>
            )}
          </button>
        );
      })}
    </nav>
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
  if (q.isPending) return <BlockSkeleton label="Carregando fotos e vídeos" />;
  if (q.isError) return <SectionError what="as fotos e vídeos" error={q.error} onRetry={() => q.refetch()} />;
  const posts = q.data.pages.flatMap((pg) => pg.items);
  if (posts.length === 0)
    return (
      <EmptyNote title="A loja ainda não publicou fotos ou vídeos.">
        Quando publicar, as imagens aparecem aqui em grade. Enquanto isso, veja a aba Loja para conhecer os
        produtos.
      </EmptyNote>
    );
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-3 gap-1 overflow-hidden rounded-xl">
        {posts.map((post) => {
          const img = post.type === "video" ? post.posterUrl : post.url;
          return (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => setOpen(post)}
                aria-label={post.caption ?? "Abrir publicação"}
                className="group relative block aspect-[3/4] w-full overflow-hidden bg-navy"
              >
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element -- mídia enviada pela loja
                  <img src={img} alt="" className="absolute inset-0 size-full object-cover" />
                )}
                {post.type === "video" ? (
                  <>
                    <Play
                      className="absolute top-2.5 right-2.5 size-5 fill-white text-white drop-shadow"
                      aria-hidden
                    />
                    {post.viewsText && (
                      <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 text-[13px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">
                        <Eye className="size-4" aria-hidden />
                        {post.viewsText}
                      </span>
                    )}
                  </>
                ) : (
                  post.product && (
                    <ShoppingBag
                      className="absolute top-2.5 right-2.5 size-5 text-white drop-shadow"
                      aria-label="Tem produto marcado"
                    />
                  )
                )}
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center gap-5 bg-navy/45 text-[15px] font-extrabold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="size-5 fill-white" />
                    {formatCount(post.likes)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="size-5 fill-white" />
                    {formatCount(post.comments)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {q.hasNextPage && (
        <button
          type="button"
          disabled={q.isFetchingNextPage}
          onClick={() => q.fetchNextPage()}
          className="h-10 self-center rounded-lg border border-border bg-surface px-5 text-sm font-bold text-text-strong"
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

const pill = (on: boolean, h: string) =>
  cn(
    "rounded-full border px-3.5 text-[13px]",
    h,
    on
      ? "border-primary bg-primary font-bold text-on-primary"
      : "border-border bg-surface font-semibold text-text-strong hover:bg-surface-2",
  );

function StoreProducts({ slug }: { slug: string }) {
  const { location } = useUserLocation();
  const pathname = usePathname();
  const requireAuth = useRequireAuth();
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("best_selling");
  const [cat, setCat] = useState<string | undefined>();
  const [want, setWant] = useState(false);

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
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-[42px] min-w-[240px] flex-1 items-center gap-2.5 rounded-full border border-border bg-surface px-4">
          <Search className="size-4 shrink-0 text-text-subtle" aria-hidden />
          <span className="sr-only">Buscar nesta loja</span>
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar nesta loja"
            className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
          />
        </label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ordenar">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={sort === s.id}
              onClick={() => setSort(s.id)}
              className={pill(sort === s.id, "h-[34px]")}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {cats.length > 1 && (
        <ul className="flex flex-wrap gap-2" aria-label="Categorias da loja">
          <li>
            <button
              type="button"
              aria-pressed={!cat}
              onClick={() => setCat(undefined)}
              className={pill(!cat, "h-8")}
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
                className={pill(cat === id, "h-8")}
              >
                {CATEGORIES.find((c) => c.id === id)?.name ?? id} <span className="opacity-70">{n}</span>
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
        <SectionError what="os produtos da loja" error={query.error} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-surface p-8 text-center">
          <span className="text-[15px] font-bold text-text-strong">
            {q || cat ? "Nada encontrado nesta loja" : "A loja ainda não cadastrou produtos."}
          </span>
          <span className="text-[13px] text-text-muted">
            {q || cat
              ? "Pergunte à loja pelo chat ou peça uma promoção do que você procura."
              : "Quando cadastrar, os produtos aparecem aqui com busca, ordenação e categorias."}
          </span>
          {q && (
            <button
              type="button"
              onClick={() => {
                if (!requireAuth("want", q)) return;
                setWant(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-[18px] text-sm font-bold text-text-strong hover:bg-surface-2"
            >
              Quero “{q}” em promoção
            </button>
          )}
        </div>
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
          className="h-10 self-center rounded-lg border border-border bg-surface px-5 text-sm font-bold text-text-strong"
        >
          {query.isFetchingNextPage ? "Carregando…" : "Ver mais produtos"}
        </button>
      )}
      {want && (
        <WantDialog
          initialTerm={q}
          radiusKm={location.radiusKm}
          returnTo={pathname}
          onClose={() => setWant(false)}
        />
      )}
    </div>
  );
}

function UpcomingLive({
  live,
}: {
  live: { id: string; title: string; startsAt: string; reminded: boolean };
}) {
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const [on, setOn] = useState(live.reminded);
  const m = useMutation({
    mutationFn: (next: boolean) => actions.liveReminder(live.id, next),
    onMutate: (next) => setOn(next),
    onError: (e, next) => {
      setOn(!next);
      toast(e instanceof Error ? e.message : "Não foi possível mudar o lembrete.", "info");
    },
  });
  const d = new Date(live.startsAt);
  const valid = !Number.isNaN(d.getTime());
  const tz = { timeZone: "America/Maceio" } as const;
  return (
    <li className="flex items-center gap-3">
      <span className="flex w-12 shrink-0 flex-col items-center rounded-[10px] bg-selected py-1.5">
        <span className="text-[11px] font-bold text-link uppercase">
          {valid ? d.toLocaleDateString("pt-BR", { ...tz, weekday: "short" }).replace(".", "") : "—"}
        </span>
        <span className="text-[15px] font-extrabold text-text-strong">
          {valid ? d.toLocaleDateString("pt-BR", { ...tz, day: "2-digit", month: "2-digit" }) : "—"}
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-text">{live.title}</span>
        <span className="text-xs text-text-muted">
          {valid
            ? `às ${d.toLocaleTimeString("pt-BR", { ...tz, hour: "2-digit", minute: "2-digit" })}`
            : "Horário não informado"}
        </span>
      </span>
      <button
        type="button"
        aria-pressed={on}
        disabled={m.isPending}
        onClick={() => {
          if (!requireAuth("reminder", live.id)) return;
          m.mutate(!on);
        }}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold",
          on ? "border-primary bg-selected text-text-strong" : "border-border bg-surface text-text-strong",
        )}
      >
        {on ? <Check className="size-3.5" aria-hidden /> : <Bell className="size-3.5" aria-hidden />}
        {on ? "Lembrete ativo" : "Lembrar"}
      </button>
    </li>
  );
}

function StoreOffers({ profile: p, onSeeStore }: { profile: Profile; onSeeStore: () => void }) {
  const { location } = useUserLocation();
  const pathname = usePathname();
  const requireAuth = useRequireAuth();
  const [wq, setWq] = useState("");
  const [want, setWant] = useState(false);
  const q = useQuery({ queryKey: ["profile", p.slug, "offers"], queryFn: () => catalog.offers(p.slug) });
  if (q.isPending) return <BlockSkeleton label="Carregando ofertas" />;
  if (q.isError) return <SectionError what="as ofertas" error={q.error} onRetry={() => q.refetch()} />;
  const o = q.data;
  const empty = !o.coupon && !o.live && o.upcomingLives.length === 0 && !o.event && o.promoCount === 0;

  return (
    <div className="flex flex-col gap-5">
      {empty && (
        <EmptyNote title="Nenhuma oferta ativa desta loja agora.">
          Cupons, lives, eventos e produtos em promoção aparecem aqui. Siga a loja para saber primeiro quando
          houver novidade.
        </EmptyNote>
      )}
      {o.coupon && <CouponCard coupon={o.coupon} variant="band" />}

      {(o.live || o.upcomingLives.length > 0) && (
        <div className={cn("grid gap-4", o.live && o.upcomingLives.length > 0 && "md:grid-cols-[1.4fr_1fr]")}>
          {o.live && (
            <Link
              href={liveHref(o.live.id)}
              className="relative flex min-h-[170px] items-end overflow-hidden rounded-2xl bg-navy"
            >
              {p.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- capa da loja
                <img src={p.coverUrl} alt="" className="absolute inset-0 size-full object-cover opacity-75" />
              )}
              <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy/90 to-navy/20" />
              <span className="relative flex flex-col gap-2 p-5">
                <span className="inline-flex h-6 items-center gap-1.5 self-start rounded-full bg-danger px-2.5 text-[11px] font-extrabold text-white">
                  <span className="size-1.5 rounded-full bg-white" aria-hidden />
                  AO VIVO · {formatCount(o.live.viewers)}
                </span>
                <span className="text-xl leading-[26px] font-extrabold text-white">{o.live.title}</span>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-accent">
                  <Play className="size-4 fill-accent" aria-hidden />
                  Assistir agora e comprar pelo chat
                </span>
              </span>
            </Link>
          )}
          {o.upcomingLives.length > 0 && (
            <section className="flex flex-col gap-3 rounded-2xl bg-surface p-6 shadow-card">
              <h2 className="text-[15px] font-bold text-text-strong">Próximas lives</h2>
              <ul className="flex flex-col gap-3">
                {o.upcomingLives.map((l) => (
                  <UpcomingLive key={l.id} live={l} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {o.event && (
        <Link
          href={`/eventos/${encodeURIComponent(o.event.id)}`}
          className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-card hover:bg-surface-2"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[11px] font-extrabold tracking-[.5px] text-accent-text">
              EVENTO DA LOJA
            </span>
            <span className="text-[17px] font-extrabold text-text-strong">{o.event.title}</span>
            <span className="text-[13px] text-text-2">
              {[
                new Date(o.event.startsAt).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "America/Maceio",
                }),
                o.event.place,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <span className="text-sm font-bold whitespace-nowrap text-link">Ver evento ›</span>
        </Link>
      )}

      <section className="flex flex-col gap-3.5" aria-labelledby="promo-t">
        <div className="flex flex-col gap-0.5">
          <h2 id="promo-t" className="text-xl leading-7 font-bold text-text-strong">
            Em promoção agora
          </h2>
          <p className="text-[13px] leading-[18px] text-text-muted">
            {o.promoCount > 0
              ? `${o.promoCount} ${o.promoCount === 1 ? "produto" : "produtos"} desta loja com desconto`
              : "Nenhum produto desta loja está em promoção agora."}
          </p>
        </div>
        {o.promoCount > 0 && (
          <button
            type="button"
            onClick={onSeeStore}
            className="self-start text-sm font-bold text-link hover:underline"
          >
            Ver os produtos da loja →
          </button>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-selected px-6 py-[22px] sm:flex-row sm:items-center sm:gap-5">
        <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-primary text-on-primary">
          <Tag className="size-6" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[17px] font-extrabold text-text-strong">
            Não achou o desconto que queria?
          </span>
          <span className="text-[13px] leading-[19px] text-text-2">
            Diga o que você quer em promoção. A loja recebe o pedido e, se criar a oferta, você é avisado na
            hora.
          </span>
        </div>
        <label className="flex h-11 items-center rounded-full border border-border-strong bg-surface px-3.5 sm:w-60">
          <span className="sr-only">O que você quer em promoção</span>
          <input
            value={wq}
            onChange={(e) => setWq(e.target.value)}
            placeholder="Ex.: tênis de corrida"
            className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (!requireAuth("want", p.id)) return;
            setWant(true);
          }}
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-bold whitespace-nowrap text-on-accent hover:brightness-95"
        >
          Quero em promoção
        </button>
      </section>
      {want && (
        <WantDialog
          initialTerm={wq.trim()}
          radiusKm={location.radiusKm}
          returnTo={pathname}
          onClose={() => setWant(false)}
        />
      )}
    </div>
  );
}

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const CARD = "flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-card";
const H2 = "text-xl leading-7 font-bold text-text-strong";
const OUTLINE_FULL =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-[18px] text-sm font-bold whitespace-nowrap text-text-strong hover:bg-surface-2";

function AboutStore({ profile: p }: { profile: Profile }) {
  const today = new Date().getDay();
  const a = p.address;
  const addr = a ? [a.street, a.neighborhood, a.city].filter(Boolean).join(", ") : "";
  const route = a ? routeUrl({ lat: a.lat, lng: a.lng, address: addr || null }) : null;
  const wa = whatsappUrl(p.whatsapp, storeMessage(p.name));
  const since = [
    p.since.business ? `Na praça desde ${p.since.business}` : null,
    p.since.platform ? `Na EncontraÊ desde ${p.since.platform}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-5">
      <section className={CARD}>
        <h2 className={H2}>Sobre a {p.name}</h2>
        <p className="text-[15px] leading-6 whitespace-pre-line text-text-2">
          {p.bio ?? "A loja ainda não escreveu uma apresentação."}
        </p>
        <span className="text-[13px] text-text-muted">{since || "Datas de início não informadas."}</span>
      </section>

      <div className="grid items-start gap-5 md:grid-cols-2">
        <section className={cn(CARD, "gap-3.5 p-5")}>
          <h3 className="text-[15px] font-bold text-text-strong">Fale com a loja</h3>
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-success-text">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            {p.responseTime ? `Costuma responder em ${p.responseTime}` : "Tempo de resposta não informado"}
          </span>
          <ChatPill profileId={p.id} label="Conversar pelo chat" look="solid" />
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track({ type: "WHATSAPP_CLICK", targetType: "STORE", targetId: p.id })}
              className={cn(OUTLINE_FULL, "border-success/40 text-success-text")}
            >
              <WhatsAppIcon className="size-4" />
              Chamar no WhatsApp
            </a>
          ) : (
            <p className="text-xs text-text-muted">A loja não informou o WhatsApp.</p>
          )}
          {p.badges.length > 0 && (
            <ul className="flex flex-col gap-2 border-t border-surface-3 pt-3">
              {p.badges.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-[13px] font-bold text-text">
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-success-soft text-success-text">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          )}
          <span className="text-xs leading-[17px] text-text-muted">
            A compra e o pagamento são combinados direto com a loja.
          </span>
        </section>

        <section className={cn(CARD, "gap-3 p-5")}>
          <h3 className="text-[15px] font-bold text-text-strong">Endereço</h3>
          <span className="text-[13px] leading-[19px] text-text-2">
            {addr || "A loja não informou o endereço."}
          </span>
          <StatusLine status={p.status} />
          {route ? (
            <a
              href={route}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track({ type: "ROUTE_REQUESTED", targetType: "STORE", targetId: p.id })}
              className={OUTLINE_FULL}
            >
              <Navigation className="size-4 text-accent-hover" aria-hidden />
              Como chegar{a?.distanceKm != null && ` · ${formatKm(a.distanceKm)}`}
            </a>
          ) : (
            <>
              <button
                type="button"
                disabled
                aria-describedby="rota-off"
                className={cn(OUTLINE_FULL, "cursor-not-allowed text-text-subtle hover:bg-surface")}
              >
                <Navigation className="size-4" aria-hidden />
                Como chegar
              </button>
              <p id="rota-off" className="text-xs text-text-muted">
                A loja não informou a localização no mapa, então não dá para traçar a rota.
              </p>
            </>
          )}
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className={CARD}>
          <h2 className={H2}>Horários</h2>
          {p.hours.length === 0 ? (
            <p className="text-text-muted">A loja não informou o horário.</p>
          ) : (
            <ul className="flex flex-col">
              {p.hours.map((h) => (
                <li
                  key={h.day}
                  className={cn(
                    "flex justify-between rounded-lg px-3 py-[9px] text-sm text-text-2",
                    h.day === today && "bg-selected font-bold text-text-strong",
                  )}
                >
                  <span>{DAYS[h.day]}</span>
                  <span>{h.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={CARD}>
          <h2 className={H2}>Pagamento e contato</h2>
          {p.payment.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {p.payment.map((t) => (
                <li
                  key={t}
                  className="inline-flex h-[30px] items-center rounded-full bg-selected px-3 text-[13px] font-semibold text-text-strong"
                >
                  {t}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">
              A loja não informou as formas de pagamento. Combine direto com ela.
            </p>
          )}
          <div className="flex flex-col gap-2.5 text-sm text-text-2">
            <span className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-text-muted" aria-hidden />
              {p.whatsapp ? `WhatsApp ${p.whatsapp}` : "Telefone não informado"}
            </span>
            <span className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 shrink-0 text-text-muted" aria-hidden />
              {p.cnpjVerified ? "CNPJ verificado pela EncontraÊ" : "CNPJ ainda não verificado"}
            </span>
          </div>
          <Link
            href={denunciarHref("loja", p.slug)}
            className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-danger-text hover:underline"
          >
            <Flag className="size-4" aria-hidden />
            Denunciar esta loja
          </Link>
        </section>
      </div>

      <TrustSignals
        id="confianca-perfil"
        description="O que a loja informou e o que a EncontraÊ conseguiu confirmar."
        signals={[
          verificationSignal(p.verification),
          cnpjSignal(p.cnpjVerified),
          updatedSignal("Perfil atualizado", p.updatedAt),
          textSignal("Tempo de resposta", p.responseTime),
          textSignal("Na EncontraÊ desde", p.since.platform),
          { ...textSignal("Horário", p.status?.text), tone: p.status ? "neutral" : "unknown" },
        ]}
      />
    </div>
  );
}

export function SimilarProfiles({ profile }: { profile: Profile }) {
  const q = useQuery({
    queryKey: ["profile", profile.slug, "similar"],
    queryFn: () => catalog.similar(profile.slug),
  });
  const isProvider = profile.kind === "provider";
  const title = isProvider
    ? `Outros ${profile.categoryLabel ?? "profissionais"} perto de você`
    : `Outras lojas${profile.categoryLabel ? ` de ${profile.categoryLabel}` : ""} perto de você`;
  return (
    <Section
      id="similar"
      title={title}
      description={`${isProvider ? "Prestadores parecidos" : "Lojas parecidas"} para comparar antes de decidir.`}
      action={{ href: routes.explorar, label: "Ver todos no Explorar" }}
    >
      {q.isPending ? (
        <CardsSkeleton count={3} label="Carregando perfis parecidos" />
      ) : q.isError ? (
        <SectionError what="os perfis parecidos" error={q.error} onRetry={() => q.refetch()} />
      ) : q.data.items.length === 0 ? (
        <EmptyNote title="Ainda não há perfis parecidos para mostrar.">
          Quando houver mais {isProvider ? "prestadores" : "lojas"} nesta categoria por perto, eles aparecem
          aqui.
        </EmptyNote>
      ) : (
        <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-3">
          {q.data.items.slice(0, 3).map((item) => (
            <li key={item.id}>
              <ResultCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ProfileSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando perfil"
      className="mx-auto flex w-full max-w-[1280px] animate-pulse flex-col gap-4"
    >
      <div className="h-[230px] rounded-t-[20px] bg-surface-2" />
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
