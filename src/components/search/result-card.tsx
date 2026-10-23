"use client";

import { useMutation } from "@tanstack/react-query";
import {
  BadgeCheck,
  ChevronDown,
  Heart,
  House,
  MapPin,
  Play,
  Star,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { CompareButton } from "@/components/comparison/compare-button";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { useResumeAction } from "@/hooks/use-resume-action";
import { track } from "@/lib/analytics/track";
import { actions } from "@/lib/api/actions";
import type { SearchItem } from "@/lib/api/search";
import { categoryById } from "@/lib/domain/categories";
import { discountPct, formatDayMonth, formatKm, formatMoney, formatRating } from "@/lib/format";
import { liveHref, lojaHref, prestadorHref, produtoHref } from "@/lib/routes";

import { FulfillmentLine } from "./fulfillment-line";

export const STATUS = {
  open: {
    label: "Aberta agora",
    place: "Aberto agora",
    dot: "bg-success",
    cls: "border-success/30 bg-success-soft text-success-text",
  },
  soon: {
    label: "Fecha em breve",
    place: "Fecha em breve",
    dot: "bg-accent-hover",
    cls: "border-accent-border bg-accent-soft text-accent-text",
  },
  closed: {
    label: "Fechada",
    place: "Fechado",
    dot: "bg-danger",
    cls: "border-danger/30 bg-danger-soft text-danger-text",
  },
} as const;

/** Destino do card (Documento de entrega › Explorar, regra 18). */
export function resultHref(item: SearchItem) {
  if (item.live) return liveHref(item.live.id);
  if (item.type === "product") return produtoHref(item.slug);
  if (item.type === "service" && item.profile) return prestadorHref(item.profile.slug);
  if (item.profile)
    return item.profile.kind === "provider" ? prestadorHref(item.profile.slug) : lojaHref(item.profile.slug);
  return produtoHref(item.slug);
}

export function targetTypeOf(item: SearchItem) {
  if (item.type === "product") return "PRODUCT" as const;
  if (item.type === "service") return "SERVICE" as const;
  return item.profile?.kind === "provider" ? ("PROVIDER" as const) : ("STORE" as const);
}

const compact = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
/** 1500 → "1,5k". Contagens pequenas ficam inteiras. */
export const kcount = (n: number) => (n >= 1000 ? `${compact.format(n / 1000)}k` : String(n));

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export type ResultCardVariant = "auto" | "reel";

/**
 * Card de resultado, com as três formas do protótipo: produto (foto alta, preço, loja), serviço (especialidades,
 * "a partir de", prestador) e lugar/experiência (foto cheia com degradê). `reel` é o card vertical de "Acontecendo
 * perto de você" (ao vivo, promoções e ofertas). Só mostra o que o servidor trouxe: sem dado, a linha some.
 */
export function ResultCard({
  item,
  onOpen,
  reason,
  variant = "auto",
  compare = true,
}: {
  item: SearchItem;
  onOpen?: () => void;
  /** Motivo de o item aparecer (ex.: "Mais perto"), vindo do servidor. */
  reason?: string | null;
  variant?: ResultCardVariant;
  /** Pílula "Comparar" no pé do card (Explorar, listas). Na Home fica de fora, como no protótipo. */
  compare?: boolean;
}) {
  if (variant === "reel") return <ReelCard item={item} onOpen={onOpen} />;
  if (item.type === "service") return <ServiceCard item={item} onOpen={onOpen} compare={compare} />;
  if (item.type === "place") return <PlaceCard item={item} onOpen={onOpen} reason={reason} />;
  return <ProductCard item={item} onOpen={onOpen} reason={reason} compare={compare} />;
}

/* ---------- peças comuns ---------- */

const cardCls =
  "group relative flex min-w-0 flex-col gap-3 rounded-2xl bg-surface p-2 pb-3 shadow-raised transition duration-150 hover:-translate-y-0.5 hover:shadow-pop";

/** Link esticado: o título cobre o card inteiro; botões (coração, comparar) ficam por cima com `relative z-10`. */
const stretched =
  "after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline";

export function Media({ item, className, light }: { item: SearchItem; className?: string; light?: boolean }) {
  const cat = item.categoryId ? categoryById(item.categoryId) : undefined;
  const CatIcon = cat?.icon;
  return (
    <>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          className={cn("absolute inset-0 size-full object-cover", className)}
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: light ? undefined : cat?.colorVar }}
          aria-hidden
        >
          {CatIcon && <CatIcon className={cn("size-12", light ? "text-white/80" : "opacity-80")} />}
        </span>
      )}
    </>
  );
}

function SponsoredTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute z-[2] inline-flex h-5 items-center rounded bg-black/55 px-2 text-[10px] font-bold tracking-wide text-white",
        className,
      )}
    >
      Patrocinado
    </span>
  );
}

function ViewsPill({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cn(
        "absolute z-[2] inline-flex h-[22px] items-center gap-1 rounded-full bg-black/30 px-2 text-[11px] font-semibold text-white",
        className,
      )}
    >
      <Play className="size-2.5 fill-white" aria-hidden />
      <span>{kcount(n)}</span>
      <span className="sr-only">visualizações</span>
    </span>
  );
}

/** Coração do card. Visitante vê o convite para entrar; depois do login a ação é retomada. */
export function CardHeart({
  item,
  className,
  inline,
}: {
  item: SearchItem;
  className?: string;
  /** Sem posição absoluta: o pai posiciona (Explorar). */
  inline?: boolean;
}) {
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const [on, setOn] = useState(item.favorited ?? false);
  const favType = item.type === "place" ? "profile" : item.type;
  const favId = item.type === "place" ? (item.profile?.id ?? item.id) : item.id;

  const m = useMutation({
    mutationFn: (next: boolean) => actions.favorite(favType, favId, next),
    onMutate: (next) => setOn(next),
    onSuccess: (_d, next) => {
      toast(next ? "Salvo em Meus Favoritos." : "Removido dos favoritos.");
      if (next && item.type === "product")
        track({ type: "PRODUCT_FAVORITE", targetType: "PRODUCT", targetId: item.id });
    },
    onError: (e, next) => {
      setOn(!next);
      toast(e instanceof Error ? e.message : "Não foi possível salvar agora.", "info");
    },
  });
  useResumeAction("favorite", favId, () => {
    if (!on) m.mutate(true);
  });

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${on ? "Remover dos favoritos" : "Salvar nos favoritos"}: ${item.title}`}
      disabled={m.isPending}
      onClick={() => {
        if (!requireAuth("favorite", favId)) return;
        m.mutate(!on);
      }}
      className={cn(
        inline ? "relative z-10" : "absolute z-10",
        "flex size-8 items-center justify-center rounded-full bg-white text-navy shadow-card transition-transform hover:scale-110 disabled:opacity-60",
        className,
      )}
    >
      <Heart className={cn("size-4", on && "fill-danger text-danger")} aria-hidden />
    </button>
  );
}

function StatusChip({ status }: { status: NonNullable<SearchItem["status"]> }) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded border px-2 text-[11px] leading-4 font-bold whitespace-nowrap",
        s.cls,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}

export function Avatar({ item, size = "md" }: { item: SearchItem; size?: "sm" | "md" }) {
  const name = item.profile?.name ?? item.title;
  const box = size === "md" ? "size-8 text-[10px]" : "size-7 text-[10px]";
  return item.profile?.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- fotos de perfil vêm de armazenamento externo
    <img src={item.profile.avatarUrl} alt="" className={cn("shrink-0 rounded-full object-cover", box)} />
  ) : (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-on-primary",
        box,
      )}
    >
      {initials(name)}
    </span>
  );
}

function Rating({ item }: { item: SearchItem }) {
  const hasRating = item.rating !== null && item.reviewCount > 0;
  if (!hasRating) return null;
  return (
    <p className="flex min-w-0 items-center gap-1 text-xs leading-4 whitespace-nowrap text-text-muted">
      {hasRating && (
        <>
          <Star className="size-3.5 shrink-0 fill-accent text-accent" aria-hidden />
          <span className="font-semibold text-text">{formatRating(item.rating as number)}</span>
          <span>({item.reviewCount} avaliações)</span>
        </>
      )}
    </p>
  );
}

function Where({ item }: { item: SearchItem }) {
  return (
    <p className="flex min-w-0 items-center gap-1 text-xs leading-4 whitespace-nowrap text-text-muted">
      <MapPin className="size-3.5 shrink-0 fill-accent-hover text-accent-hover" aria-hidden />
      {item.distanceKm !== null ? (
        <>
          <span className="font-semibold text-text">{formatKm(item.distanceKm)}</span>
          <FulfillmentLine item={item} />
          {item.neighborhood && (
            <>
              <span aria-hidden className="mx-0.5 text-border-strong">
                ·
              </span>
              <span className="truncate">{item.neighborhood}</span>
            </>
          )}
        </>
      ) : (
        <span className="truncate">
          {item.neighborhood ? `${item.neighborhood} · ` : ""}distância indisponível
        </span>
      )}
    </p>
  );
}

function PriceDate({ item }: { item: SearchItem }) {
  const d = item.price?.updatedAt ? formatDayMonth(item.price.updatedAt) : null;
  return d ? <span className="text-[11px] leading-4 text-text-subtle">Preço informado em {d}</span> : null;
}

/* ---------- produto ---------- */

function ProductCard({
  item,
  onOpen,
  reason,
  compare,
}: {
  item: SearchItem;
  onOpen?: () => void;
  reason?: string | null;
  compare: boolean;
}) {
  const pct = item.price ? discountPct(item.price.amountCents, item.price.oldAmountCents) : 0;
  // destaque (regra 19): oferta sem preço antigo > novo > atende em casa
  const highlight =
    item.offerText && !item.price?.oldAmountCents
      ? { text: item.offerText, cls: "bg-accent-soft text-accent-text" }
      : !item.price && item.isNew
        ? { text: "Novo na plataforma", cls: "bg-success-soft text-success-text" }
        : !item.price && item.homeService
          ? { text: "Atende em casa", cls: "bg-selected text-link" }
          : null;

  return (
    <article className={cardCls}>
      <div className="relative h-[260px] overflow-hidden rounded-lg bg-surface-2">
        <Media item={item} />
        {typeof item.viewCount === "number" && <ViewsPill n={item.viewCount} className="top-2.5 left-2.5" />}
        {item.sponsored && <SponsoredTag className="top-10 left-2.5" />}
        {reason && (
          <span className="absolute bottom-2.5 left-2.5 z-[2] inline-flex h-6 items-center rounded-full bg-white px-2.5 text-xs font-bold text-navy">
            {reason}
          </span>
        )}
        <CardHeart item={item} className="top-2 right-2" />
      </div>

      <div className="flex flex-col gap-2 px-1">
        <h3 className="truncate text-sm leading-5 font-medium text-text">
          <Link href={resultHref(item)} onClick={onOpen} className={stretched} title={item.title}>
            {item.title}
          </Link>
        </h3>
        <div className="flex flex-col gap-1.5">
          <Rating item={item} />
          <Where item={item} />
        </div>

        {item.price && (
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-x-2">
              {item.price.unit && <span className="text-xs text-text-muted">{item.price.unit}</span>}
              {item.price.oldAmountCents && pct > 0 && (
                <>
                  <span className="text-xs text-text-subtle line-through">
                    {formatMoney(item.price.oldAmountCents)}
                  </span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] leading-4 font-extrabold text-on-accent">
                    {pct}% OFF
                  </span>
                </>
              )}
              <span className="text-xl leading-7 font-bold text-text-strong">
                {formatMoney(item.price.amountCents)}
              </span>
            </div>
            <PriceDate item={item} />
          </div>
        )}
        {highlight && (
          <p className={cn("self-start rounded-md px-2 py-1 text-xs font-semibold", highlight.cls)}>
            {highlight.text}
          </p>
        )}

        {item.profile && (
          <>
            <div className="h-px bg-surface-3" />
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar item={item} />
                <span className="truncate text-xs leading-4 font-semibold text-text">
                  {item.profile.name}
                </span>
                {item.profile.verified && (
                  <BadgeCheck className="size-3.5 shrink-0 text-link" aria-label="Identidade verificada" />
                )}
              </div>
              {item.status && <StatusChip status={item.status} />}
            </div>
          </>
        )}
        {!item.profile && item.status && <StatusChip status={item.status} />}
        {compare && <CompareButton item={item} />}
      </div>
    </article>
  );
}

/* ---------- serviço ---------- */

function ServiceCard({ item, onOpen, compare }: { item: SearchItem; onOpen?: () => void; compare: boolean }) {
  const cat = item.categoryId ? categoryById(item.categoryId) : undefined;
  const CatIcon = cat?.icon;
  const modeLabel = item.homeService ? "Atende em domicílio" : item.serviceNote ? "Atende no local" : null;

  return (
    <article className={cardCls}>
      <div className="relative h-60 overflow-hidden rounded-lg bg-surface-2">
        <Media item={item} />
        {typeof item.viewCount === "number" && <ViewsPill n={item.viewCount} className="top-2.5 left-2.5" />}
        {item.sponsored && (
          <SponsoredTag className={item.viewCount ? "top-10 left-2.5" : "top-2.5 left-2.5"} />
        )}
        <span className="absolute top-2.5 right-2.5 z-[2] inline-flex h-6 items-center rounded-full bg-white px-2.5 text-xs font-bold text-navy">
          Serviço
        </span>
      </div>

      <div className="flex flex-col gap-2 px-1">
        {cat && CatIcon && (
          <span className="inline-flex h-6 max-w-full items-center gap-1.5 self-start overflow-hidden rounded-full bg-selected pr-2.5 pl-2 text-xs leading-4 font-bold whitespace-nowrap text-text-strong">
            <CatIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{cat.name}</span>
          </span>
        )}
        <h3 className="truncate text-sm leading-5 font-medium text-text">
          <Link href={resultHref(item)} onClick={onOpen} className={stretched} title={item.title}>
            {item.title}
          </Link>
        </h3>
        {item.specialties && item.specialties.length > 0 && (
          <p className="truncate text-xs leading-4 text-text-subtle">{item.specialties.join(" • ")}</p>
        )}
        {item.price ? (
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              {item.price.unit && (
                <span className="text-xs leading-4 text-text-muted">{item.price.unit}</span>
              )}
              <span className="text-xl leading-7 font-bold text-text-strong">
                {formatMoney(item.price.amountCents)}
              </span>
            </div>
            <PriceDate item={item} />
          </div>
        ) : item.offerText ? (
          <span className="self-start rounded-md bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-text">
            {item.offerText}
          </span>
        ) : (
          <span className="text-xs leading-4 text-text-subtle">Preço sob consulta</span>
        )}
        <div className="flex flex-col gap-1.5">
          <Rating item={item} />
          <Where item={item} />
          {modeLabel && (
            <p className="flex min-w-0 items-center gap-1 text-xs leading-4 whitespace-nowrap text-text-muted">
              {item.homeService ? (
                <House className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <Store className="size-3.5 shrink-0" aria-hidden />
              )}
              <span className="font-bold text-text">{modeLabel}</span>
              {item.serviceNote && (
                <>
                  <span aria-hidden className="mx-0.5 text-border-strong">
                    ·
                  </span>
                  <span className="truncate">{item.serviceNote}</span>
                </>
              )}
            </p>
          )}
        </div>
        {item.profile && (
          <>
            <div className="h-px bg-surface-3" />
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar item={item} size="sm" />
                <span className="truncate text-xs leading-4 font-semibold text-text">
                  {item.profile.name}
                </span>
                {item.profile.verified && (
                  <BadgeCheck className="size-3.5 shrink-0 text-link" aria-label="Identidade verificada" />
                )}
              </div>
              {item.status && <StatusChip status={item.status} />}
            </div>
          </>
        )}
        {compare && <CompareButton item={item} />}
      </div>
    </article>
  );
}

/* ---------- lugar / experiência ---------- */

/**
 * Card de experiência (protótipo): foto cheia com degradê, selo de situação no topo, título e preço embaixo e o
 * botão "mais" que abre categoria, nota, bairro e quem oferece.
 */
function PlaceCard({
  item,
  onOpen,
  reason,
}: {
  item: SearchItem;
  onOpen?: () => void;
  reason?: string | null;
}) {
  const [more, setMore] = useState(false);
  const cat = item.categoryId ? categoryById(item.categoryId) : undefined;
  const plaque = item.scheduleLabel ?? (item.status ? STATUS[item.status].place : null);
  const dot = item.status ? STATUS[item.status].dot : "bg-accent-hover";
  const plaqueCls = item.status
    ? { open: "text-success-text", soon: "text-accent-text", closed: "text-danger-text" }[item.status]
    : "text-text-strong";
  const href = resultHref(item);
  const chip = reason ?? cat?.name;
  return (
    <article className="card group relative h-[420px] min-w-0 overflow-hidden rounded-2xl bg-navy-700 text-white shadow-raised transition duration-150 hover:-translate-y-0.5 hover:shadow-pop">
      <Media item={item} light />
      <span aria-hidden className="scrim-place pointer-events-none absolute inset-0" />
      <Link
        href={href}
        onClick={onOpen}
        aria-label={item.title}
        tabIndex={-1}
        className="absolute inset-0 z-[1]"
      />
      {plaque && (
        <span
          className={cn(
            "pointer-events-none absolute top-3 left-3 z-[2] inline-flex h-6 items-center gap-1.5 rounded bg-white px-2 text-[11px] leading-4 font-bold",
            plaqueCls,
          )}
        >
          <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
          {plaque}
        </span>
      )}
      {item.sponsored && <SponsoredTag className="pointer-events-none top-11 left-3 tracking-[0.3px]" />}
      <CardHeart item={item} className="top-2 right-2" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex flex-col gap-1.5 p-3">
        {more && (
          <div className="flex flex-col gap-2">
            {chip && (
              <span className="inline-flex h-6 items-center self-start rounded-full bg-white/[0.18] px-2.5 text-xs leading-4 font-bold whitespace-nowrap">
                {chip}
              </span>
            )}
            {item.description && (
              <span className="truncate text-xs leading-4 text-white/80">{item.description}</span>
            )}
            <p className="flex min-w-0 items-center gap-1 text-xs leading-4 whitespace-nowrap text-white/85">
              {typeof item.viewCount === "number" && (
                <>
                  <Play className="size-2.5 fill-white" aria-hidden />
                  {kcount(item.viewCount)}
                  <span aria-hidden className="mx-0.5 text-white/60">
                    ·
                  </span>
                </>
              )}
              {item.rating !== null && item.reviewCount > 0 && (
                <>
                  <Star className="size-3.5 shrink-0 fill-accent text-accent" aria-hidden />
                  <span className="font-semibold text-white">{formatRating(item.rating)}</span>
                  <span>({item.reviewCount})</span>
                  <span aria-hidden className="mx-0.5 text-white/60">
                    ·
                  </span>
                </>
              )}
              <span className="truncate">
                {item.distanceKm !== null ? formatKm(item.distanceKm) : "distância indisponível"}
                {item.neighborhood && ` · ${item.neighborhood}`}
              </span>
            </p>
          </div>
        )}
        <h3 className="truncate text-base leading-6 font-bold">
          <Link
            href={href}
            onClick={onOpen}
            className="pointer-events-auto relative z-[2]"
            title={item.title}
          >
            {item.title}
          </Link>
        </h3>
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex min-w-0 flex-1 items-baseline gap-1 overflow-hidden whitespace-nowrap">
            {item.price ? (
              <>
                {item.price.unit && (
                  <span className="text-xs leading-4 text-white/85">{item.price.unit}</span>
                )}
                <span className="text-xl leading-7 font-bold text-accent">
                  {formatMoney(item.price.amountCents)}
                </span>
              </>
            ) : item.offerText ? (
              <span className="truncate text-sm leading-5 font-bold text-accent">{item.offerText}</span>
            ) : null}
          </div>
          <button
            type="button"
            aria-expanded={more}
            aria-label={`${more ? "Menos" : "Mais"} informações: ${item.title}`}
            onClick={() => setMore((m) => !m)}
            className="pointer-events-auto relative z-[3] inline-flex h-[26px] shrink-0 items-center gap-0.5 rounded-full pr-1.5 pl-2 text-xs font-semibold text-white"
          >
            {more ? "menos" : "mais"}
            <ChevronDown
              className={cn("size-3.5 transition-transform", more && "rotate-180")}
              strokeWidth={2.4}
              aria-hidden
            />
          </button>
        </div>
        {more && item.profile && (
          <div className="flex flex-col gap-2">
            <div className="h-px bg-white/20" />
            <div className="flex min-w-0 items-center gap-1.5">
              <Avatar item={item} size="sm" />
              <span className="truncate text-xs leading-4 font-semibold">{item.profile.name}</span>
              {item.profile.verified && (
                <BadgeCheck className="size-3.5 shrink-0" aria-label="Identidade verificada" />
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/* ---------- reel (Acontecendo perto de você) ---------- */

function ReelCard({ item, onOpen }: { item: SearchItem; onOpen?: () => void }) {
  const pct = item.price ? discountPct(item.price.amountCents, item.price.oldAmountCents) : 0;
  const tag = item.live
    ? { text: "AO VIVO", cls: "bg-danger text-white", live: true }
    : pct > 0
      ? { text: `${pct}% OFF`, cls: "bg-accent text-on-accent", live: false }
      : item.offerText
        ? { text: "Oferta", cls: "bg-accent text-on-accent", live: false }
        : item.isNew
          ? { text: "Novo", cls: "bg-white text-navy", live: false }
          : null;
  const right = item.live
    ? kcount(item.live.viewers)
    : typeof item.viewCount === "number"
      ? kcount(item.viewCount)
      : null;

  return (
    <article
      className={cn(
        "group relative h-[380px] min-w-0 overflow-hidden rounded-2xl bg-navy-700 text-white shadow-raised transition duration-150 hover:-translate-y-0.5 hover:shadow-pop",
        item.live && "outline-[3px] -outline-offset-[3px] outline-danger",
      )}
    >
      <Media item={item} light />
      <span aria-hidden className="scrim-reel pointer-events-none absolute inset-0" />
      <Link
        href={resultHref(item)}
        onClick={onOpen}
        aria-label={item.title}
        tabIndex={-1}
        className="absolute inset-0 z-[1]"
      />
      {tag && (
        <span
          className={cn(
            "absolute top-2.5 left-2.5 z-[2] inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-extrabold",
            tag.cls,
          )}
        >
          {tag.live && <span className="size-[7px] animate-pulse rounded-full bg-white" aria-hidden />}
          {tag.text}
        </span>
      )}
      {right && (
        <span className="absolute top-2.5 right-2.5 z-[2] inline-flex h-[22px] items-center gap-1 rounded-full bg-black/35 px-2 text-[11px] font-semibold">
          <Play className="size-2.5 fill-white" aria-hidden />
          {right}
          {item.live && <span className="sr-only">assistindo</span>}
        </span>
      )}
      {item.live && (
        <span
          aria-hidden
          className="absolute top-[38%] left-1/2 z-[2] flex size-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-white/25 transition-transform group-hover:scale-110"
        >
          <Play className="size-[18px] fill-white" aria-hidden />
        </span>
      )}
      {item.sponsored && <SponsoredTag className="top-10 left-2.5" />}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex flex-col gap-1.5 p-3">
        {item.profile && (
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full border-2 border-amber bg-navy-700 text-[9px] font-extrabold">
              {initials(item.profile.name)}
            </span>
            <span className="truncate text-xs font-bold">{item.profile.name}</span>
            {item.distanceKm !== null && (
              <span className="shrink-0 text-[11px] whitespace-nowrap text-white/75">
                · {formatKm(item.distanceKm)}
              </span>
            )}
          </div>
        )}
        <h3 className="text-[15px] leading-5 font-bold">
          <Link
            href={resultHref(item)}
            onClick={onOpen}
            className="pointer-events-auto line-clamp-2"
            title={item.title}
          >
            {item.title}
          </Link>
        </h3>
        {item.price ? (
          <p className="text-sm leading-5 font-extrabold text-amber">
            {item.price.unit ? `${item.price.unit} ` : ""}
            {formatMoney(item.price.amountCents)}
          </p>
        ) : item.offerText ? (
          <p className="line-clamp-1 text-sm leading-5 font-extrabold text-amber">{item.offerText}</p>
        ) : null}
      </div>
    </article>
  );
}

export function ResultCardSkeleton({ variant = "auto" }: { variant?: ResultCardVariant | "tall" }) {
  if (variant === "reel" || variant === "tall")
    return (
      <div
        aria-hidden
        className={cn(
          "animate-pulse rounded-2xl bg-surface-2",
          variant === "reel" ? "h-[380px]" : "h-[420px]",
        )}
      />
    );
  return (
    <div
      aria-hidden
      className="flex animate-pulse flex-col gap-3 rounded-2xl bg-surface p-2 pb-3 shadow-card"
    >
      <div className="h-[260px] rounded-lg bg-surface-2" />
      <div className="flex flex-col gap-2 px-1">
        <div className="h-4 w-4/5 rounded bg-surface-2" />
        <div className="h-3 w-1/2 rounded bg-surface-2" />
        <div className="h-3 w-2/3 rounded bg-surface-2" />
        <div className="h-6 w-1/3 rounded bg-surface-2" />
      </div>
    </div>
  );
}
