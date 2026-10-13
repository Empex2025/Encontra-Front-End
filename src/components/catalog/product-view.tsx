"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, Check, Clock, MapPin, Minus, Plus, Scale, Star, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { ResultCard, ResultCardSkeleton, targetTypeOf } from "@/components/search/result-card";
import { WantDialog } from "@/components/search/want-dialog";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
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
import { markViewed } from "@/lib/domain/recently-viewed";
import { productMessage, QUICK_QUESTIONS } from "@/lib/domain/whatsapp";
import { discountPct, formatCount, formatDayMonth, formatKm, formatMoney, formatRating } from "@/lib/format";
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
import { ShareButton } from "./share-button";
import { StatusLine } from "./status-line";

type TabId = "descricao" | "avaliacoes" | "loja";

export function ProductView({ slug }: { slug: string }) {
  const q = useQuery({
    queryKey: ["product", slug],
    queryFn: () => catalog.product(slug),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });

  if (q.isPending) return <ProductSkeleton />;
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFound />;
    return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  }
  return <ProductContent product={q.data} />;
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

  const ask = useMutation({
    mutationFn: (draft: string) =>
      actions.startConversation({ profileId: p.profile.id, productId: p.id, draft }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });

  const profilePath =
    p.profile.kind === "provider" ? prestadorHref(p.profile.slug) : lojaHref(p.profile.slug);

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <nav aria-label="Trilha" className="flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
        <button
          type="button"
          onClick={() => router.back()}
          className="font-semibold text-link hover:underline"
        >
          Voltar
        </button>
        <span aria-hidden>/</span>
        <Link href={routes.home} className="hover:underline">
          Início
        </Link>
        {cat && (
          <>
            <span aria-hidden>/</span>
            <Link href={`${routes.explorar}?cat=${cat.id}`} className="hover:underline">
              {cat.name}
            </Link>
          </>
        )}
        <span aria-hidden>/</span>
        <span className="truncate text-text">{p.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Gallery media={p.media} title={p.title} />

        <div className="flex flex-col gap-5">
          <header className="flex flex-wrap items-center gap-3">
            <Link href={profilePath} className="flex min-w-0 items-center gap-3">
              <Avatar name={p.profile.name} url={p.profile.avatarUrl} size={44} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-bold text-text-strong">{p.profile.name}</span>
                <span className="text-xs text-text-muted">{formatCount(followers)} seguidores</span>
              </span>
            </Link>
            <FollowButton profile={p.profile} onFollowersChange={(d) => setFollowers((n) => n + d)} />
            <span className="ml-auto flex items-center gap-2">
              <FavoriteButton type="product" id={p.id} initial={p.favorited} label={p.title} />
              <ShareButton
                path={produtoHref(p.slug)}
                title={p.title}
                noun="produto"
                report={denunciarHref("produto", p.slug)}
                trackTarget={target}
              />
            </span>
            <StatusLine status={p.profile.status} />
          </header>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-text-strong sm:text-[28px] sm:leading-9">{p.title}</h1>
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-text-muted">
              {p.rating !== null && p.reviewCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setTab("avaliacoes")}
                  className="inline-flex items-center gap-1 font-semibold text-text hover:underline"
                >
                  <Star className="size-4 fill-accent text-accent" aria-hidden />
                  {formatRating(p.rating)} ({p.reviewCount} avaliações)
                </button>
              ) : (
                <span>Ainda sem avaliações</span>
              )}
              {p.sold !== null && <span>· {formatCount(p.sold)} vendidos</span>}
            </p>
          </div>

          <section aria-label="Preço" className="flex flex-col gap-2">
            {p.price ? (
              <>
                <p className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-3xl font-bold text-text-strong">
                    {formatMoney(p.price.amountCents)}
                  </span>
                  {p.price.oldAmountCents && pct > 0 && (
                    <>
                      <span className="text-base text-text-subtle line-through">
                        {formatMoney(p.price.oldAmountCents)}
                      </span>
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-on-accent">
                        -{pct}%
                      </span>
                    </>
                  )}
                </p>
                {priceDate && (
                  <p className="text-xs text-text-subtle">Preço informado pela loja em {priceDate}</p>
                )}
              </>
            ) : (
              <p className="text-lg font-semibold text-text-muted">Preço não informado. Pergunte à loja.</p>
            )}
            <p className="text-sm text-text-muted">Pagamento combinado direto com a loja.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => openAlert(["price_drop"])}
                className="inline-flex h-10 items-center gap-1.5 text-sm font-semibold text-link hover:underline"
              >
                <Bell className="size-4" aria-hidden />
                {hasAlert ? "Alerta ativo ✓" : "Avise-me se baixar o preço"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth("want", p.id)) return;
                  setWantOpen(true);
                }}
                className="inline-flex h-10 items-center gap-1.5 text-sm font-semibold text-link hover:underline"
              >
                <Tag className="size-4" aria-hidden />
                Quero isso em promoção em outras lojas perto ›
              </button>
            </div>
          </section>

          <p className="flex flex-wrap items-center gap-x-2 text-sm text-text-muted">
            <MapPin className="size-4" aria-hidden />
            {p.location.distanceKm !== null ? formatKm(p.location.distanceKm) : "Distância indisponível"}
            {(p.location.neighborhood || p.location.city) && (
              <span>· {[p.location.neighborhood, p.location.city].filter(Boolean).join(", ")}</span>
            )}
            <Link
              href={`${routes.explorar}?q=${encodeURIComponent(p.title)}`}
              className="font-semibold text-link hover:underline"
            >
              · Ver no mapa
            </Link>
          </p>

          {p.sizes && p.sizes.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-bold text-text-strong">Tamanho</legend>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    aria-pressed={size === s.label}
                    aria-label={s.available ? `Tamanho ${s.label}` : `Tamanho ${s.label}, esgotado`}
                    onClick={() => (s.available ? setSize(s.label) : openAlert(["restock"], s.label))}
                    className={cn(
                      "h-11 min-w-11 rounded-lg border px-3 text-sm font-bold",
                      size === s.label && "border-primary bg-primary text-on-primary",
                      s.available &&
                        size !== s.label &&
                        "border-border-strong text-text hover:border-primary",
                      !s.available && "border-border text-text-subtle line-through",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {size && p.sizes.find((s) => s.label === size && !s.available) && (
                <p className="text-sm text-text-muted">Tamanho {size} esgotado nesta loja.</p>
              )}
              {p.sizes.some((s) => !s.available) && (
                <button
                  type="button"
                  onClick={() => openAlert(["restock"], p.sizes!.find((s) => !s.available)?.label ?? null)}
                  className="self-start text-sm font-semibold text-link hover:underline"
                >
                  Avise-me quando voltar ao estoque
                </button>
              )}
            </fieldset>
          )}

          <p
            className={cn(
              "flex items-center gap-2 text-sm font-semibold",
              p.stock.state === "available" ? "text-success-text" : "text-text-muted",
            )}
          >
            {p.stock.state === "available" && <Check className="size-4" aria-hidden />}
            {p.stock.state === "available"
              ? [
                  "Disponível",
                  p.stock.units !== null ? `${p.stock.units} unidades na loja` : null,
                  p.stock.pickupText,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : p.stock.state === "unavailable"
                ? "Indisponível no momento"
                : "Disponibilidade não informada. Pergunte à loja."}
          </p>

          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-bold text-text-strong" id="qty-label">
                Quantidade
              </p>
              <p className="text-xs text-text-muted">Vai junto na mensagem para a loja</p>
            </div>
            <div className="ml-auto flex items-center gap-2" role="group" aria-labelledby="qty-label">
              <button
                type="button"
                disabled={qty <= 1}
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                aria-label="Diminuir quantidade"
                className="flex size-11 items-center justify-center rounded-lg border border-border-strong disabled:opacity-40"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <output aria-live="polite" className="w-8 text-center text-lg font-bold">
                {qty}
              </output>
              <button
                type="button"
                disabled={qty >= max}
                onClick={() => setQty((n) => Math.min(max, n + 1))}
                aria-label="Aumentar quantidade"
                className="flex size-11 items-center justify-center rounded-lg border border-border-strong disabled:opacity-40"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <section aria-label="Contato com a loja" className="flex flex-col gap-3">
            <ContactButtons
              profile={p.profile}
              productId={p.id}
              draft={qty > 1 ? message : undefined}
              whatsappText={message}
              target={target}
            />
            {p.profile.responseTime && (
              <p className="flex items-center gap-1.5 text-sm text-text-muted">
                <Clock className="size-4" aria-hidden />
                Costuma responder em {p.profile.responseTime} pelo chat da EncontraÊ
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-bold text-text-strong">Pergunte à loja:</p>
              <ul className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((qn) => (
                  <li key={qn}>
                    <button
                      type="button"
                      disabled={ask.isPending}
                      onClick={() => {
                        if (!requireAuth("chat", p.profile.id)) return;
                        ask.mutate(qn);
                      }}
                      className="h-10 rounded-full border border-border bg-surface px-3.5 text-sm font-medium text-text hover:bg-surface-2 disabled:opacity-60"
                    >
                      {qn}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <p className="rounded-lg bg-surface-2 p-3 text-sm text-text-muted">
              <span className="font-semibold text-text">Mensagem pronta para o WhatsApp:</span> “{message}”
            </p>
          </section>

          <CompareBlock product={p} />

          {p.coupon && <CouponCard coupon={p.coupon} productTitle={p.title} />}

          {p.sameLine && p.sameLine.count > 0 && (
            <Link
              href={profilePath}
              className="flex flex-col gap-0.5 rounded-xl border border-border p-4 hover:bg-surface-2"
            >
              <span className="font-bold text-text-strong">
                Veja a mesma linha e as promoções da {p.profile.name}
              </span>
              <span className="text-sm text-text-muted">
                {p.sameLine.count} {p.sameLine.count === 1 ? "produto" : "produtos"} na loja · a partir de{" "}
                {formatMoney(p.sameLine.fromCents)}
                {p.sameLine.promoCount > 0 && ` · ${p.sameLine.promoCount} em promoção`}
              </span>
              <span className="text-sm font-semibold text-link">Ver na loja →</span>
            </Link>
          )}

          {p.storeBadges.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {p.storeBadges.map((b) => (
                <li key={b} className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-text-2">
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section aria-label="Detalhes">
        <Tabs
          label="Detalhes do produto"
          value={tab}
          onChange={(v) => setTab(v as TabId)}
          tabs={[
            { id: "descricao", label: "Descrição" },
            { id: "avaliacoes", label: "Avaliações", count: p.reviewCount },
            { id: "loja", label: "Sobre a loja" },
          ]}
        />
        <TabPanel
          label={tab === "descricao" ? "Descrição" : tab === "avaliacoes" ? "Avaliações" : "Sobre a loja"}
        >
          {tab === "descricao" && (
            <div className="flex flex-col gap-5">
              {p.description ? (
                <p className="whitespace-pre-line text-text">{p.description}</p>
              ) : (
                <p className="text-text-muted">A loja ainda não escreveu uma descrição.</p>
              )}
              {p.specs.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-bold text-text-strong">Informações técnicas</h2>
                  <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                    {p.specs.map((s) => (
                      <div
                        key={s.label}
                        className="flex justify-between gap-4 bg-surface px-4 py-2.5 text-sm"
                      >
                        <dt className="text-text-muted">{s.label}</dt>
                        <dd className="text-right font-semibold text-text">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
          {tab === "avaliacoes" && (
            <ReviewsPanel
              target="products"
              slug={p.slug}
              reviewHref={avaliarHref("produto", p.slug)}
              reviewLabel="Avaliar este produto"
            />
          )}
          {tab === "loja" && (
            <div className="flex flex-col gap-3 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <Info label="Endereço" value={p.about.address} />
                <Info label="Horário" value={p.about.hoursText} />
                <Info label="Tempo de resposta" value={p.about.responseTime} />
              </dl>
              <Link
                href={profilePath}
                className="self-start rounded-lg border border-primary px-5 py-3 text-sm font-bold text-text-strong hover:bg-surface-2"
              >
                Ver perfil da loja
              </Link>
            </div>
          )}
        </TabPanel>
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

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-surface-2 p-3">
      <dt className="text-xs font-bold text-text-subtle">{label}</dt>
      <dd className="text-text">{value ?? "Não informado"}</dd>
    </div>
  );
}

/** Comparar: máximo de 3 itens do mesmo grupo (docs/contratos/comparar.md). Sem grupo comparável, o bloco some. */
function CompareBlock({ product: p }: { product: Product }) {
  const { list, toggle, clear } = useComparisonSelection();
  const toast = useToast();
  if (!p.group) return null;
  const ref = itemRef("product", p.id);
  const state = buttonState(list, ref, p.group.id);
  const group = p.group;
  const current = list[0]?.group.label;

  const onClick = () => {
    const r = toggle({ ref, group, origin: `produto:${p.slug}` });
    if (r === "removed") toast("Removido da comparação.");
    if (r === "added") toast("Adicionado à comparação.");
  };

  return (
    <section aria-label="Comparação" className="flex flex-col gap-2 rounded-xl border border-border p-4">
      {state === "other_group" ? (
        <>
          <p className="text-sm text-text">
            Sua comparação atual é de <b>{current}</b>. Não é possível misturar categorias.
          </p>
          <button
            type="button"
            onClick={() => {
              clear();
              toggle({ ref, group, origin: `produto:${p.slug}` });
            }}
            className="self-start text-sm font-bold text-link hover:underline"
          >
            Começar comparação de {group.label} →
          </button>
        </>
      ) : state === "full" ? (
        <p className="text-sm text-text">
          Você já tem 3 opções. Remova uma na tela Comparar para adicionar esta.
        </p>
      ) : (
        <button
          type="button"
          aria-pressed={state === "in"}
          onClick={onClick}
          className={cn(
            "inline-flex h-10 items-center gap-2 self-start rounded-full border px-4 text-sm font-bold",
            state === "in"
              ? "border-primary bg-primary text-on-primary"
              : "border-border-strong text-text-2 hover:bg-surface-2",
          )}
        >
          {state === "in" ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Scale className="size-4" aria-hidden />
          )}
          {state === "in" ? "Na comparação" : "Comparar"}
        </button>
      )}
      {state === "in" && (
        <p className="text-sm text-text-muted">
          ✓ Na sua comparação de {group.label}: {list.length} de 3.{" "}
          <Link href={routes.comparar} className="font-semibold text-link hover:underline">
            {list.length >= 2 ? "Comparar opções →" : "Buscar mais opções →"}
          </Link>
        </p>
      )}
    </section>
  );
}

function Related({ slug }: { slug: string }) {
  const q = useQuery({ queryKey: ["product", slug, "related"], queryFn: () => catalog.related(slug) });
  if (q.isPending)
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <ResultCardSkeleton key={i} />
        ))}
      </div>
    );
  if (q.isError || q.data.items.length === 0) return null;
  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <h2 id="related-title" className="text-xl font-bold text-text-strong">
          Quem viu este produto também viu
        </h2>
        <Link href={routes.explorar} className="py-2 text-sm font-semibold text-link hover:underline">
          Ver todos
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
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
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando produto"
      className="mx-auto grid w-full max-w-6xl animate-pulse gap-8 lg:grid-cols-2"
    >
      <div className="aspect-square rounded-2xl bg-surface-2" />
      <div className="flex flex-col gap-4">
        <div className="h-10 w-2/3 rounded bg-surface-2" />
        <div className="h-8 w-1/3 rounded bg-surface-2" />
        <div className="h-24 rounded bg-surface-2" />
        <div className="h-12 rounded bg-surface-2" />
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
