"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  Car,
  Check,
  CreditCard,
  MapPin,
  Navigation,
  Package,
  Scale,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { ResultCard, targetTypeOf } from "@/components/search/result-card";
import { WantDialog } from "@/components/search/want-dialog";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useResumeAction } from "@/hooks/use-resume-action";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import { useUserLocation } from "@/hooks/use-user-location";
import { track } from "@/lib/analytics/track";
import { actions } from "@/lib/api/actions";
import { catalog, type Product } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import type { AlertCondition } from "@/lib/api/actions";
import { categoryById } from "@/lib/domain/categories";
import { buttonState, itemRef } from "@/lib/domain/comparison";
import { routeUrl } from "@/lib/domain/offer";
import { markViewed } from "@/lib/domain/recently-viewed";
import { priceSignal, stockSignal, textSignal, verificationSignal } from "@/lib/domain/trust";
import { productMessage, QUICK_QUESTIONS } from "@/lib/domain/whatsapp";
import { discountPct, formatDayMonth, formatInt, formatKm, formatMoney, formatRating } from "@/lib/format";
import {
  avaliarHref,
  conversaHref,
  denunciarHref,
  lojaHref,
  prestadorHref,
  produtoHref,
  routes,
} from "@/lib/routes";

import { AlertDialog } from "./alert-dialog";
import { Avatar } from "./avatar";
import { ContactButtons } from "./contact-buttons";
import { CouponCard } from "./coupon-card";
import { FavoriteButton } from "./favorite-button";
import { FollowButton } from "./follow-button";
import { Gallery } from "./gallery";
import { ReviewsPanel } from "./reviews-panel";
import { CardsSkeleton, EmptyNote, PageError, SectionError } from "./section-state";
import { ShareButton } from "./share-button";
import { StatusLine } from "./status-line";
import { TrustSignals } from "./trust-signals";
import { UnderlineTabs } from "./underline-tabs";

type TabId = "descricao" | "avaliacoes" | "loja";

const CHIP =
  "inline-flex items-center gap-1.5 rounded-full bg-selected px-2.5 text-xs font-semibold text-text-strong h-7";
const OUTLINE_BTN =
  "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-surface px-3 text-sm font-semibold text-text-strong hover:bg-selected";

export function ProductView({ slug }: { slug: string }) {
  const q = useQuery({
    queryKey: ["product", slug],
    queryFn: () => catalog.product(slug),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });

  if (q.isPending) return <ProductSkeleton />;
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFound />;
    return (
      <PageError
        what="o produto"
        error={q.error}
        onRetry={() => q.refetch()}
        backHref={routes.explorar}
        backLabel="Buscar outros produtos"
      />
    );
  }
  return <ProductContent product={q.data} />;
}

/** Ícone do selo da loja pelo texto (estacionamento, retirada, pagamento); sem correspondência, um "ok". */
function badgeIcon(label: string) {
  const t = label.toLowerCase();
  if (t.includes("estacion")) return Car;
  if (t.includes("retirad") || t.includes("entrega")) return Package;
  if (t.includes("pix") || t.includes("cart") || t.includes("pagamento")) return CreditCard;
  return Check;
}

function ProductContent({ product: p }: { product: Product }) {
  const router = useRouter();
  const pathname = usePathname();
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const { location } = useUserLocation();
  const [tab, setTab] = useState<TabId>("descricao");
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [followers, setFollowers] = useState(p.profile.followers);
  const [alertOpen, setAlertOpen] = useState<{ conditions: AlertCondition[]; size: string | null } | null>(
    null,
  );
  const [wantOpen, setWantOpen] = useState(false);

  useEffect(() => {
    markViewed({ type: "product", slug: p.slug });
    track({ type: "PRODUCT_VIEW", targetType: "PRODUCT", targetId: p.id });
  }, [p.slug, p.id]);

  const cat = p.categoryId ? categoryById(p.categoryId) : undefined;
  const pct = p.price ? discountPct(p.price.amountCents, p.price.oldAmountCents) : 0;
  const priceDate = p.price?.updatedAt ? formatDayMonth(p.price.updatedAt) : null;
  const max = Math.max(1, Math.min(p.maxQuantity, p.stock.units ?? p.maxQuantity));
  const hasAlert = !!p.alert;
  const route = routeUrl({ lat: p.location.lat, lng: p.location.lng, address: p.about.address });
  const stock = stockSignal(p.stock);
  const soldOut = p.sizes?.filter((s) => !s.available) ?? [];
  const soldOutRef = size && soldOut.some((s) => s.label === size) ? size : (soldOut[0]?.label ?? null);

  const message = productMessage({
    store: p.profile.name,
    title: p.title,
    size,
    quantity: qty,
    priceCents: p.price?.amountCents ?? null,
  });
  const target = { targetType: "PRODUCT" as const, targetId: p.id };

  const openAlert = (conditions: AlertCondition[], forSize: string | null = size) => {
    if (!requireAuth("alert", p.id)) return;
    setAlertOpen({ conditions, size: forSize });
  };

  useResumeAction("alert", p.id, () => setAlertOpen({ conditions: ["price_drop"], size }));
  useResumeAction("want", p.id, () => setWantOpen(true));

  const ask = useMutation({
    mutationFn: (draft: string) =>
      actions.startConversation({ profileId: p.profile.id, productId: p.id, draft }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });

  const profilePath =
    p.profile.kind === "provider" ? prestadorHref(p.profile.slug) : lojaHref(p.profile.slug);
  const place = [p.location.neighborhood, p.location.city].filter(Boolean).join(", ");
  const compare = useCompare(p);

  return (
    <article className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
      <nav aria-label="Trilha" className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 font-semibold text-link hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar
        </button>
        <span aria-hidden className="text-border-strong">
          /
        </span>
        <Link href={routes.home} className="hover:underline">
          Início
        </Link>
        {cat && (
          <>
            <span aria-hidden className="text-border-strong">
              /
            </span>
            <Link href={`${routes.explorar}?cat=${cat.id}`} className="hover:underline">
              {cat.name}
            </Link>
          </>
        )}
        <span aria-hidden className="text-border-strong">
          /
        </span>
        <span className="truncate font-medium text-text">{p.title}</span>
      </nav>

      <section
        aria-label="Produto"
        className="grid gap-6 rounded-2xl bg-surface p-4 shadow-card sm:p-8 lg:grid-cols-[minmax(0,min(600px,49%))_minmax(0,1fr)] lg:gap-12"
      >
        <Gallery media={p.media} title={p.title} />

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-surface-3 bg-bg p-2.5 pr-3 sm:gap-6">
              <Link href={profilePath} className="flex min-w-0 items-center gap-2.5">
                <Avatar
                  name={p.profile.name}
                  url={p.profile.avatarUrl}
                  size={40}
                  shape="circle"
                  tone="navy"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm leading-5 font-semibold text-text">{p.profile.name}</span>
                  <span className="text-xs leading-4 text-text-subtle">
                    {formatInt(followers)} seguidores
                  </span>
                </span>
              </Link>
              <FollowButton
                profile={p.profile}
                variant="card"
                onFollowersChange={(d) => setFollowers((n) => n + d)}
              />
            </div>
            <div className="flex items-center gap-2">
              <StatusLine status={p.profile.status} variant="chip" />
              <FavoriteButton
                type="product"
                id={p.id}
                initial={p.favorited}
                label={p.title}
                variant="circle"
              />
              <ShareButton
                variant="icon"
                path={produtoHref(p.slug)}
                title={p.title}
                noun="produto"
                report={denunciarHref("produto", p.slug)}
                trackTarget={target}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl leading-8 font-bold text-text-strong sm:text-[32px] sm:leading-10">
              {p.title}
            </h1>
            <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm text-text-muted">
              {p.rating !== null && p.reviewCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setTab("avaliacoes");
                    document.getElementById("avaliacoes")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1 hover:text-text"
                >
                  <Star className="size-4 fill-accent text-accent" aria-hidden />
                  <span className="font-semibold text-text">{formatRating(p.rating)}</span>
                  <span className="underline">({p.reviewCount} avaliações)</span>
                </button>
              ) : (
                <span>Ainda sem avaliações</span>
              )}
              <span aria-hidden className="mx-0.5 text-border-strong">
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <ShoppingBag className="size-4" aria-hidden />
                {p.sold !== null ? `${formatInt(p.sold)} vendidos` : "Vendas não informadas"}
              </span>
            </p>
          </div>

          <section aria-label="Preço" className="flex flex-col gap-1">
            {p.price ? (
              <>
                <span className="text-4xl leading-[48px] font-bold text-text-strong sm:text-[40px]">
                  {formatMoney(p.price.amountCents)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {p.price.oldAmountCents && pct > 0 && (
                    <>
                      <span className="text-base text-text-subtle line-through">
                        {formatMoney(p.price.oldAmountCents)}
                      </span>
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-[13px] leading-5 font-extrabold text-on-accent">
                        {pct}% OFF
                      </span>
                    </>
                  )}
                  <span className="text-[13px] leading-5 text-text-muted">
                    Pagamento combinado direto com a loja
                  </span>
                </div>
                <p className="text-xs text-text-subtle">
                  {priceDate
                    ? `Preço informado pela loja em ${priceDate}`
                    : "Preço informado pela loja. Data da atualização não informada."}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-text-muted">Preço não informado. Pergunte à loja.</p>
                <p className="text-[13px] text-text-muted">Pagamento combinado direto com a loja</p>
              </>
            )}
            <button
              type="button"
              onClick={() => openAlert(["price_drop"])}
              className="mt-1 inline-flex h-8 items-center gap-1.5 self-start rounded-full border border-border bg-surface px-3 text-xs font-bold text-text-strong hover:bg-selected"
            >
              <Bell className="size-3.5" aria-hidden />
              {hasAlert ? "Alerta ativo ✓" : "Avise-me se baixar o preço"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!requireAuth("want", p.id)) return;
                setWantOpen(true);
              }}
              className="mt-1.5 inline-flex items-center gap-1.5 self-start text-[13px] font-bold text-accent-text hover:underline"
            >
              <span aria-hidden>%</span>
              Quero isso em promoção em outras lojas perto ›
            </button>
          </section>

          <p className="flex flex-wrap items-center gap-x-1 text-sm text-text-muted">
            <MapPin className="size-4 text-accent-hover" aria-hidden />
            {p.location.distanceKm !== null ? (
              <span className="font-semibold text-text">{formatKm(p.location.distanceKm)}</span>
            ) : (
              <span>Distância indisponível</span>
            )}
            {place && (
              <>
                <span aria-hidden className="mx-0.5 text-border-strong">
                  ·
                </span>
                <span>{place}</span>
              </>
            )}
            <span aria-hidden className="mx-0.5 text-border-strong">
              ·
            </span>
            <Link
              href={`${routes.explorar}?q=${encodeURIComponent(p.title)}`}
              className="font-semibold text-link underline"
            >
              Ver no mapa
            </Link>
          </p>

          <div className="h-px bg-surface-3" aria-hidden />

          {p.sizes && p.sizes.length > 0 && (
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-base font-bold text-text-strong">
                Tamanho: <span className="font-normal text-text-muted">{size ?? "escolha o seu"}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    aria-pressed={size === s.label}
                    aria-label={s.available ? `Tamanho ${s.label}` : `Tamanho ${s.label}, esgotado`}
                    onClick={() => (s.available ? setSize(s.label) : openAlert(["restock"], s.label))}
                    className={cn(
                      "h-11 min-w-14 rounded-lg px-3.5 text-sm font-semibold",
                      size === s.label && "border-2 border-primary bg-selected text-text-strong",
                      s.available &&
                        size !== s.label &&
                        "border border-border bg-surface text-text-strong hover:border-primary",
                      !s.available &&
                        "border border-dashed border-border-strong text-text-subtle line-through",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {soldOutRef && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs text-text-subtle">Tamanho {soldOutRef} esgotado nesta loja.</span>
                  <button
                    type="button"
                    onClick={() => openAlert(["restock"], soldOutRef)}
                    className="inline-flex h-[30px] items-center gap-1.5 rounded-full border-[1.5px] border-accent-hover bg-accent-soft px-3 text-xs font-extrabold text-text-strong hover:brightness-95"
                  >
                    <Bell className="size-3.5" aria-hidden />
                    Avise-me quando o {soldOutRef} voltar
                  </button>
                </div>
              )}
            </fieldset>
          )}

          <div className="flex flex-col gap-0.5">
            <p className="flex flex-wrap items-center gap-x-2 text-sm leading-5">
              <span
                aria-hidden
                className={cn(
                  "size-2.5 rounded-full",
                  p.stock.state === "available"
                    ? "bg-success ring-[3px] ring-success-soft"
                    : "bg-border-strong ring-[3px] ring-surface-2",
                )}
              />
              <span
                className={cn(
                  "font-bold",
                  p.stock.state === "available" ? "text-success-text" : "text-text-muted",
                )}
              >
                {p.stock.state === "available"
                  ? "Disponível"
                  : p.stock.state === "unavailable"
                    ? "Indisponível"
                    : "Disponibilidade não informada"}
              </span>
              <span className="text-text-muted">
                {p.stock.state === "unknown"
                  ? "· Pergunte à loja antes de ir"
                  : [
                      "segundo a loja",
                      p.stock.units !== null ? `${p.stock.units} unidades na loja` : null,
                      p.stock.pickupText,
                    ]
                      .filter(Boolean)
                      .map((t) => `· ${t}`)
                      .join(" ")}
              </span>
            </p>
            {stock.hint && p.stock.state !== "unknown" && (
              <p className="pl-[18px] text-xs text-text-subtle">{stock.hint}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-base font-bold text-text-strong" id="qty-label">
                Quantidade
              </p>
              <p className="text-xs text-text-muted">Vai junto na mensagem para a loja</p>
            </div>
            <div
              className="flex items-center rounded-lg border border-border bg-bg"
              role="group"
              aria-labelledby="qty-label"
            >
              <button
                type="button"
                disabled={qty <= 1}
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                aria-label="Diminuir quantidade"
                className="size-11 text-xl text-text-strong disabled:opacity-40"
              >
                −
              </button>
              <output aria-live="polite" className="min-w-8 text-center text-base font-bold text-text">
                {qty}
              </output>
              <button
                type="button"
                disabled={qty >= max}
                onClick={() => setQty((n) => Math.min(max, n + 1))}
                aria-label="Aumentar quantidade"
                className="size-11 text-xl text-text-strong disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          <section aria-label="Contato com a loja" className="flex flex-col gap-2">
            <ContactButtons
              profile={p.profile}
              productId={p.id}
              draft={qty > 1 ? message : undefined}
              whatsappText={message}
              target={target}
              look="bold"
            />
            {p.profile.responseTime && (
              <p className="flex items-center gap-1.5 text-xs leading-4 text-text-muted">
                <span aria-hidden className="size-2 rounded-full bg-success" />
                <span>
                  Costuma responder em <b className="text-success-text">{p.profile.responseTime}</b> pelo chat
                  da EncontraÊ
                </span>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs leading-4 font-bold text-text-muted">Pergunte à loja:</span>
              {QUICK_QUESTIONS.map((qn) => (
                <button
                  key={qn}
                  type="button"
                  disabled={ask.isPending}
                  onClick={() => {
                    if (!requireAuth("chat", p.profile.id)) return;
                    ask.mutate(qn);
                  }}
                  className="inline-flex h-[30px] items-center rounded-full border border-navy-200 bg-surface px-3 text-xs font-semibold text-text-strong hover:bg-selected disabled:opacity-60"
                >
                  {qn}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {route ? (
                <a
                  href={route}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track({ type: "ROUTE_REQUESTED", targetType: "PRODUCT", targetId: p.id })}
                  className={OUTLINE_BTN}
                >
                  <Navigation className="size-4 text-accent-hover" aria-hidden />
                  Como chegar
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-describedby="rota-off"
                  className={cn(
                    OUTLINE_BTN,
                    "cursor-not-allowed border-border text-text-subtle hover:bg-surface",
                  )}
                >
                  <Navigation className="size-4" aria-hidden />
                  Como chegar
                </button>
              )}
              <Link href={profilePath} className={OUTLINE_BTN}>
                Ver loja
              </Link>
              {compare.button}
            </div>
            {!route && (
              <p id="rota-off" className="text-xs text-text-muted">
                Como chegar indisponível: endereço não informado.
              </p>
            )}
            {compare.note}

            {p.coupon && <CouponCard coupon={p.coupon} productTitle={p.title} variant="inline" />}

            {p.sameLine && p.sameLine.count > 0 && (
              <Link
                href={profilePath}
                className="flex items-center justify-between gap-3 rounded-xl border border-surface-3 bg-bg px-3.5 py-3 hover:bg-selected"
              >
                <span className="flex flex-col">
                  <span className="text-sm leading-5 font-bold text-text-strong">
                    Veja a mesma linha e as promoções da {p.profile.name}
                  </span>
                  <span className="text-xs leading-4 text-text-muted">
                    {p.sameLine.count} {p.sameLine.count === 1 ? "produto" : "produtos"} na loja · a partir de{" "}
                    {formatMoney(p.sameLine.fromCents)}
                    {p.sameLine.promoCount > 0 && ` · ${p.sameLine.promoCount} em promoção`}
                  </span>
                </span>
                <span className="text-sm font-bold whitespace-nowrap text-link">Ver na loja →</span>
              </Link>
            )}

            <p className="flex gap-2.5 rounded-lg bg-bg px-3.5 py-3 text-[13px] leading-5 text-text-muted">
              <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-success-text" />
              <span>
                Mensagem pronta para o WhatsApp: <strong className="text-text">“{message}”</strong>
              </span>
            </p>
          </section>

          <section aria-label="Selos da loja">
            {p.storeBadges.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {p.storeBadges.map((b) => {
                  const Icon = badgeIcon(b);
                  return (
                    <li key={b} className={CHIP}>
                      <Icon className="size-3.5" aria-hidden />
                      {b}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-text-subtle">A loja não informou selos.</p>
            )}
          </section>
        </div>
      </section>

      <section
        id="avaliacoes"
        aria-label="Detalhes"
        className="flex scroll-mt-24 flex-col gap-6 rounded-2xl bg-surface p-4 shadow-card sm:p-8"
      >
        <UnderlineTabs
          label="Detalhes do produto"
          value={tab}
          onChange={(v) => setTab(v as TabId)}
          tabs={[
            { id: "descricao", label: "Descrição" },
            { id: "avaliacoes", label: "Avaliações", count: p.reviewCount },
            { id: "loja", label: "Sobre a loja" },
          ]}
        />
        <div
          role="tabpanel"
          aria-label={
            tab === "descricao" ? "Descrição" : tab === "avaliacoes" ? "Avaliações" : "Sobre a loja"
          }
          tabIndex={0}
          className="outline-none"
        >
          {tab === "descricao" && (
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
              <div className="flex min-w-0 flex-1 flex-col gap-4 text-base leading-[26px] text-text">
                {p.description ? (
                  <p className="whitespace-pre-line">{p.description}</p>
                ) : (
                  <p className="text-text-muted">A loja ainda não escreveu uma descrição.</p>
                )}
                <p>
                  Combine o pagamento e a retirada direto com {p.profile.name}, pelo WhatsApp ou pelo chat da
                  EncontraÊ.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 lg:w-[min(520px,45%)]">
                <h2 className="text-lg leading-6 font-bold text-text-strong">Informações técnicas</h2>
                {p.specs.length > 0 ? (
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {p.specs.map((s) => (
                      <div
                        key={s.label}
                        className="flex justify-between gap-3 rounded-lg bg-bg px-4 py-3 text-sm leading-5"
                      >
                        <dt className="text-text-muted">{s.label}</dt>
                        <dd className="text-right font-semibold text-text-strong">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-text-muted">A loja não informou características técnicas.</p>
                )}
              </div>
            </div>
          )}
          {tab === "avaliacoes" && (
            <ReviewsPanel
              target="products"
              slug={p.slug}
              reviewHref={avaliarHref("produto", p.slug)}
              reviewLabel="Avaliar este produto"
              layout="split"
              note="Avaliações de pessoas que encontraram este produto pela EncontraÊ."
            />
          )}
          {tab === "loja" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <Avatar
                  name={p.profile.name}
                  url={p.profile.avatarUrl}
                  size={72}
                  shape="circle"
                  tone="navy"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-xl leading-7 font-bold text-text-strong">{p.profile.name}</span>
                  <p className="flex items-center gap-1 text-sm text-text-muted">
                    <MapPin className="size-4 shrink-0 text-accent-hover" aria-hidden />
                    {p.about.address ?? "Endereço não informado"}
                  </p>
                  <p className="text-sm text-text-muted">
                    {p.about.hoursText ?? "Horário não informado"}
                    {p.about.responseTime && ` · Responde em média em ${p.about.responseTime}`}
                  </p>
                </div>
                <Link
                  href={profilePath}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-medium text-on-primary hover:bg-primary-hover"
                >
                  <Store className="size-4" aria-hidden />
                  Ver perfil da loja
                </Link>
              </div>
              <TrustSignals
                id="confianca-produto"
                description="O que a loja informou e o que a EncontraÊ conseguiu confirmar."
                signals={[
                  verificationSignal(p.profile.verification),
                  priceSignal(p.price),
                  stock,
                  textSignal("Tempo de resposta", p.profile.responseTime),
                ]}
              />
            </div>
          )}
        </div>
      </section>

      <Related slug={p.slug} />

      {alertOpen && (
        <AlertDialog
          product={p}
          initialConditions={alertOpen.conditions}
          initialSize={alertOpen.size}
          onClose={() => setAlertOpen(null)}
        />
      )}
      {wantOpen && (
        <WantDialog
          initialTerm={p.title}
          radiusKm={location.radiusKm}
          returnTo={pathname}
          onClose={() => setWantOpen(false)}
        />
      )}
    </article>
  );
}

/**
 * Comparar: máximo de 3 itens do mesmo grupo (docs/contratos/comparar.md). Devolve o botão da fileira de ações
 * ("Comparar" / "Na comparação") e o aviso que vem logo abaixo (quantos já foram escolhidos, outro grupo, cheia).
 * Sem grupo comparável o botão fica desativado e explica o motivo.
 */
function useCompare(p: Product): { button: React.ReactNode; note: React.ReactNode } {
  const { list, toggle, clear } = useComparisonSelection();
  const toast = useToast();

  if (!p.group)
    return {
      button: (
        <button
          type="button"
          disabled
          aria-describedby="compare-off"
          className={cn(OUTLINE_BTN, "cursor-not-allowed border-border text-text-subtle hover:bg-surface")}
        >
          <Scale className="size-4" aria-hidden />
          Comparar
        </button>
      ),
      note: (
        <p id="compare-off" className="text-xs text-text-muted">
          Este produto ainda não tem um grupo de comparação definido, então não dá para compará-lo com outras
          lojas. Você pode{" "}
          <Link
            href={`${routes.explorar}?q=${encodeURIComponent(p.title)}`}
            className="font-semibold text-link hover:underline"
          >
            buscar opções parecidas
          </Link>
          .
        </p>
      ),
    };

  const ref = itemRef("product", p.id);
  const group = p.group;
  const state = buttonState(list, ref, group.id);
  const current = list[0]?.group.label;
  const blocked = state === "other_group" || state === "full";

  const onClick = () => {
    const r = toggle({ ref, group, origin: `produto:${p.slug}` });
    if (r === "removed") toast("Removido da comparação.");
    if (r === "added") toast("Adicionado à comparação.");
  };

  return {
    button: (
      <button
        type="button"
        aria-pressed={state === "in"}
        disabled={blocked}
        onClick={onClick}
        className={cn(
          "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-sm text-text-strong disabled:cursor-not-allowed disabled:opacity-50",
          state === "in"
            ? "border-accent-hover bg-accent-soft font-bold hover:brightness-95"
            : "border-primary bg-surface font-semibold hover:bg-selected",
        )}
      >
        <Scale className="size-4" aria-hidden />
        {state === "in" ? "Na comparação" : "Comparar"}
      </button>
    ),
    note:
      state === "in" ? (
        <p
          role="status"
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-accent-border bg-accent-soft px-3.5 py-2.5 text-[13px] leading-5 text-text-2"
        >
          <span>
            ✓ Na sua comparação de {group.label}: <b>{list.length} de 3</b>
          </span>
          <Link href={routes.comparar} className="font-bold text-text-strong hover:underline">
            {list.length >= 2 ? "Comparar opções" : "Buscar mais opções para comparar"} →
          </Link>
        </p>
      ) : state === "other_group" ? (
        <p
          role="status"
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[13px] leading-5 text-text-2"
        >
          <span>
            Sua comparação atual é de <b>{current}</b>. Não é possível misturar categorias.
          </span>
          <button
            type="button"
            onClick={() => {
              clear();
              toggle({ ref, group, origin: `produto:${p.slug}` });
            }}
            className="font-bold whitespace-nowrap text-text-strong hover:underline"
          >
            Começar comparação de {group.label} →
          </button>
        </p>
      ) : state === "full" ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[13px] text-text-2"
        >
          Você já tem 3 opções. Remova uma na tela Comparar para adicionar esta.
        </p>
      ) : null,
  };
}

function Related({ slug }: { slug: string }) {
  const q = useQuery({ queryKey: ["product", slug, "related"], queryFn: () => catalog.related(slug) });
  return (
    <section aria-labelledby="related-t" className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h2 id="related-t" className="text-2xl leading-8 font-bold text-text-strong">
          Quem viu este produto também viu
        </h2>
        <Link href={routes.explorar} className="text-sm font-bold text-accent-hover hover:underline">
          Ver todos
        </Link>
      </div>
      {q.isPending ? (
        <CardsSkeleton label="Carregando produtos relacionados" />
      ) : q.isError ? (
        <SectionError what="os produtos relacionados" error={q.error} onRetry={() => q.refetch()} />
      ) : q.data.items.length === 0 ? (
        <EmptyNote title="Ainda não há produtos relacionados a este.">
          Quando outras pessoas virem produtos parecidos, eles aparecem aqui. Enquanto isso,{" "}
          <Link href={routes.explorar} className="font-semibold text-link hover:underline">
            busque no Explorar
          </Link>
          .
        </EmptyNote>
      ) : (
        <ul className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {q.data.items.slice(0, 4).map((item, i) => (
            <li key={item.id}>
              <ResultCard
                item={item}
                onOpen={() =>
                  track({
                    type: "SEARCH_RESULT_CLICK",
                    targetType: targetTypeOf(item),
                    targetId: item.id,
                    props: { q: null, position: i + 1, sponsored: item.sponsored, source: "product:related" },
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando produto"
      className="mx-auto grid w-full max-w-[1280px] animate-pulse gap-8 rounded-2xl bg-surface p-4 sm:p-8 lg:grid-cols-[minmax(0,min(600px,49%))_minmax(0,1fr)]"
    >
      <div className="aspect-square rounded-2xl bg-surface-2" />
      <div className="flex flex-col gap-4">
        <div className="h-14 rounded-2xl bg-surface-2" />
        <div className="h-10 w-2/3 rounded bg-surface-2" />
        <div className="h-12 w-1/3 rounded bg-surface-2" />
        <div className="h-24 rounded bg-surface-2" />
        <div className="h-14 rounded bg-surface-2" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-bold text-text-strong">Produto não encontrado</h1>
      <p className="text-text-muted">Ele pode ter sido removido ou o endereço está incorreto.</p>
      <Link
        href={routes.explorar}
        className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-hover"
      >
        Buscar outros produtos
      </Link>
    </section>
  );
}
