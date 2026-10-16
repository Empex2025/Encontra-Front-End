"use client";

import { BadgeCheck, CircleCheck, Home, MapPin, Sparkles, Star, Tag } from "lucide-react";
import Link from "next/link";

import { CompareButton } from "@/components/comparison/compare-button";
import { cn } from "@/components/ui/cn";
import type { SearchItem } from "@/lib/api/search";
import { categoryById } from "@/lib/domain/categories";
import { discountPct, formatKm, formatMoney, formatRating } from "@/lib/format";
import { lojaHref, prestadorHref } from "@/lib/routes";

import { Avatar, CardHeart, initials, kcount, Media, resultHref, STATUS } from "./result-card";

/** Alturas da foto em ciclo, como o mosaico do protótipo (Explorar › Grade). É só ritmo visual, não é dado. */
const PHOTO_H = [300, 220, 260, 200, 320, 240, 280, 210];
export const photoHeight = (index: number) => PHOTO_H[index % PHOTO_H.length];

const STATUS_TEXT = {
  open: "text-success-text",
  soon: "text-accent-text",
  closed: "text-danger-text",
} as const;

const cardCls =
  "card group relative flex min-w-0 flex-col gap-3 rounded-2xl bg-surface p-2 pb-3 shadow-raised transition duration-150 hover:-translate-y-0.5 hover:shadow-pop";
const stretched =
  "after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline";
const dot = (
  <span aria-hidden className="mx-0.5 text-border-strong">
    ·
  </span>
);

function profileHref(item: SearchItem) {
  if (!item.profile) return null;
  return item.profile.kind === "provider" ? prestadorHref(item.profile.slug) : lojaHref(item.profile.slug);
}

function StatusText({ status }: { status: NonNullable<SearchItem["status"]> }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-[5px] text-xs leading-4 font-semibold whitespace-nowrap",
        STATUS_TEXT[status],
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS[status].dot)} aria-hidden />
      {STATUS[status].place}
    </span>
  );
}

function Rating({ item, extra }: { item: SearchItem; extra?: React.ReactNode }) {
  const has = item.rating !== null && item.reviewCount > 0;
  if (!has && !extra) return null;
  return (
    <p className="flex min-w-0 items-center gap-1 overflow-hidden text-xs leading-4 whitespace-nowrap text-text-muted">
      {has && (
        <>
          <Star className="size-3.5 shrink-0 fill-accent text-accent" aria-hidden />
          <span className="font-semibold text-text">{formatRating(item.rating as number)}</span>
          <span>({item.reviewCount})</span>
          <span className="sr-only">avaliações</span>
        </>
      )}
      {has && extra && dot}
      {extra}
    </p>
  );
}

function Where({ item, note }: { item: SearchItem; note?: string | null }) {
  return (
    <>
      <MapPin className="size-3.5 shrink-0 fill-accent-hover text-accent-hover" aria-hidden />
      {item.distanceKm !== null ? (
        <>
          <span className="font-semibold text-text">{formatKm(item.distanceKm)}</span>
          {(note ?? item.neighborhood) && (
            <>
              {dot}
              <span className="truncate">{note ?? item.neighborhood}</span>
            </>
          )}
        </>
      ) : (
        <span className="truncate">
          {item.neighborhood ? `${item.neighborhood} · ` : ""}distância indisponível
        </span>
      )}
    </>
  );
}

/** Linha de destaque: oferta sem preço antigo, novidade ou "atende em casa" (só quando não há preço). */
function highlightOf(item: SearchItem) {
  if (item.offerText && !item.price?.oldAmountCents)
    return { text: item.offerText, cls: "text-accent-text", Icon: Tag };
  if (!item.price && !item.offerText && item.isNew)
    return { text: "Novo na plataforma", cls: "text-success-text", Icon: Sparkles };
  if (!item.price && !item.offerText && item.homeService)
    return { text: "Atende em domicílio", cls: "text-link", Icon: Home };
  return null;
}

function Highlight({ item }: { item: SearchItem }) {
  const h = highlightOf(item);
  if (!h) return null;
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5 text-[13px] leading-[18px] font-semibold", h.cls)}>
      <h.Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{h.text}</span>
    </span>
  );
}

/** Foto do card: ao vivo, posição no ranking de preço, "Patrocinado", coração e comparar. */
function Photo({
  item,
  height,
  rank,
  onOpen,
}: {
  item: SearchItem;
  height: number;
  rank?: number;
  onOpen?: () => void;
}) {
  const isService = item.type === "service";
  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-2" style={{ height }}>
      <Link
        href={resultHref(item)}
        onClick={onOpen}
        tabIndex={-1}
        aria-hidden
        className="absolute inset-0 block"
      >
        <Media item={item} />
      </Link>
      {item.live && (
        <span className="pointer-events-none absolute top-2.5 left-2.5 z-[2] inline-flex h-6 items-center gap-1.5 rounded-full bg-danger px-2.5 text-[11px] font-extrabold text-white">
          <span className="size-[7px] animate-pulse rounded-full bg-white" aria-hidden />
          AO VIVO · {item.live.viewers}
        </span>
      )}
      {!item.live && rank !== undefined && rank < 3 && (
        <span
          className={cn(
            "pointer-events-none absolute top-2.5 left-2.5 z-[2] flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[13px] font-extrabold ring-2 ring-white",
            rank === 0 ? "bg-accent text-on-accent" : "bg-primary text-on-primary",
          )}
        >
          {rank + 1}º
        </span>
      )}
      {item.sponsored && (
        <span
          className={cn(
            "pointer-events-none absolute left-2.5 z-[2] inline-flex h-5 items-center rounded bg-black/55 px-2 text-[10px] font-bold text-white",
            isService ? "top-2.5" : "bottom-2.5",
            isService && (item.live || rank !== undefined) && "top-11",
          )}
        >
          Patrocinado
        </span>
      )}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
        {item.type !== "place" && <CompareButton item={item} variant="icon" />}
        <CardHeart item={item} inline />
      </div>
    </div>
  );
}

function Footer({ item, verifiedIcon }: { item: SearchItem; verifiedIcon?: boolean }) {
  const href = profileHref(item);
  if (!item.profile) return item.status ? <StatusText status={item.status} /> : null;
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 pt-0.5">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar item={item} size="sm" />
        {href ? (
          <Link
            href={href}
            className="relative z-10 truncate text-xs leading-4 font-semibold text-text-muted hover:underline"
          >
            {item.profile.name}
          </Link>
        ) : (
          <span className="truncate text-xs leading-4 font-semibold text-text-muted">
            {item.profile.name}
          </span>
        )}
        {item.profile.verified && (
          <BadgeCheck className="size-3.5 shrink-0 text-link" aria-label="Identidade verificada" />
        )}
      </div>
      {!verifiedIcon && item.status && <StatusText status={item.status} />}
    </div>
  );
}

export type ExplorarCardProps = {
  item: SearchItem;
  /** Posição na lista (define a altura da foto no mosaico). */
  index: number;
  /** Mostra a posição 1º/2º/3º quando a lista está ordenada por preço. */
  ranked?: boolean;
  onOpen?: () => void;
  /** Fotos mais baixas, para a seção "Parecidos". */
  photo?: number;
};

/** Card do Explorar: produto e lugar (CardB) ou serviço (CardServico), com as medidas do protótipo. */
export function ExplorarCard({ item, index, ranked, onOpen, photo }: ExplorarCardProps) {
  const height = photo ?? photoHeight(index);
  const rank = ranked && item.price ? index : undefined;
  return item.type === "service" ? (
    <ServiceCard item={item} height={height} rank={rank} onOpen={onOpen} />
  ) : (
    <OfferCard item={item} height={height} rank={rank} onOpen={onOpen} />
  );
}

function OfferCard({
  item,
  height,
  rank,
  onOpen,
}: {
  item: SearchItem;
  height: number;
  rank?: number;
  onOpen?: () => void;
}) {
  const pct = item.price ? discountPct(item.price.amountCents, item.price.oldAmountCents) : 0;
  return (
    <article className={cardCls}>
      <Photo item={item} height={height} rank={rank} onOpen={onOpen} />
      <div className="flex flex-col gap-2 px-1">
        <h3 className="truncate text-[15px] leading-5 font-semibold text-text">
          <Link href={resultHref(item)} onClick={onOpen} className={stretched} title={item.title}>
            {item.title}
          </Link>
        </h3>
        {item.price && (
          <div className="flex flex-wrap items-center gap-x-1.5 whitespace-nowrap">
            {item.price.oldAmountCents && pct > 0 && (
              <>
                <span className="text-xs leading-4 text-text-subtle line-through">
                  {formatMoney(item.price.oldAmountCents)}
                </span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] leading-4 font-extrabold text-on-accent">
                  -{pct}%
                </span>
              </>
            )}
            <span className="text-lg leading-7 font-bold text-text-strong">
              {formatMoney(item.price.amountCents)}
            </span>
            {item.price.unit && <span className="text-[11px] text-text-subtle">{item.price.unit}</span>}
          </div>
        )}
        <Highlight item={item} />
        <p className="flex min-w-0 items-center gap-1 overflow-hidden text-xs leading-4 whitespace-nowrap text-text-muted">
          {item.rating !== null && item.reviewCount > 0 && (
            <>
              <Star className="size-3.5 shrink-0 fill-accent text-accent" aria-hidden />
              <span className="font-semibold text-text">{formatRating(item.rating)}</span>
              <span>({item.reviewCount})</span>
              <span className="sr-only">avaliações</span>
              {dot}
            </>
          )}
          <Where item={item} />
        </p>
        <Footer item={item} />
      </div>
    </article>
  );
}

function ServiceCard({
  item,
  height,
  rank,
  onOpen,
}: {
  item: SearchItem;
  height: number;
  rank?: number;
  onOpen?: () => void;
}) {
  const cat = item.categoryId ? categoryById(item.categoryId) : undefined;
  const CatIcon = cat?.icon;
  const mode = item.homeService ? "Atende em domicílio" : item.serviceNote ? "Atendimento no local" : null;
  const price = item.price;
  return (
    <article className={cardCls}>
      <Photo item={item} height={height} rank={rank} onOpen={onOpen} />
      <div className="flex flex-col gap-2 px-1">
        {cat && CatIcon && (
          <span className="inline-flex h-6 max-w-full items-center gap-1.5 self-start overflow-hidden rounded-full bg-selected pr-2.5 pl-2 text-xs leading-4 font-bold whitespace-nowrap text-text-strong">
            <CatIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{cat.name}</span>
          </span>
        )}
        <div className="flex flex-col gap-0.5">
          <h3 className="truncate text-sm leading-5 font-medium text-text">
            <Link href={resultHref(item)} onClick={onOpen} className={stretched} title={item.title}>
              {item.title}
            </Link>
          </h3>
          {item.specialties && item.specialties.length > 0 && (
            <p className="truncate text-xs leading-4 text-text-subtle">{item.specialties.join(" • ")}</p>
          )}
        </div>
        {price ? (
          <div className="flex flex-wrap items-baseline gap-x-1.5 whitespace-nowrap">
            {price.unit && <span className="text-xs leading-4 text-text-muted">{price.unit}</span>}
            <span className="text-xl leading-7 font-bold text-text-strong">
              {formatMoney(price.amountCents)}
            </span>
            {price.oldAmountCents && (
              <span className="text-xs text-text-subtle line-through">
                {formatMoney(price.oldAmountCents)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs leading-4 text-text-subtle">Preço sob consulta</span>
        )}
        <Highlight item={item} />
        <div className="flex flex-col gap-1.5">
          <Rating
            item={item}
            extra={
              typeof item.doneCount === "number" ? (
                <>
                  <CircleCheck className="size-3.5 shrink-0 text-success" strokeWidth={2.4} aria-hidden />
                  <span>{kcount(item.doneCount)} atendimentos</span>
                </>
              ) : null
            }
          />
          <p className="flex min-w-0 items-center gap-1 overflow-hidden text-xs leading-4 whitespace-nowrap text-text-muted">
            <Where item={item} note={mode ?? item.neighborhood} />
          </p>
        </div>
        <Footer item={item} verifiedIcon />
      </div>
    </article>
  );
}

/** Linha da lista ao lado do mapa (Explorar › Mapa): foto 96 px, título, situação, nota, distância e preço. */
export function ExplorarRow({ item, onOpen }: { item: SearchItem; onOpen?: () => void }) {
  const pct = item.price ? discountPct(item.price.amountCents, item.price.oldAmountCents) : 0;
  const cat = item.categoryId ? categoryById(item.categoryId) : undefined;
  const right = item.live
    ? { text: `${item.live.viewers} assistindo`, cls: "text-danger-text", dotCls: "bg-danger animate-pulse" }
    : item.status
      ? { text: STATUS[item.status].place, cls: STATUS_TEXT[item.status], dotCls: STATUS[item.status].dot }
      : null;
  const sub = [cat?.name, item.profile?.name].filter(Boolean).join(" · ");
  return (
    <Link
      href={resultHref(item)}
      onClick={onOpen}
      className="flex items-stretch gap-3.5 rounded-[14px] bg-surface p-3 hover:bg-surface-2"
    >
      <span className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2">
        <Media item={item} className="" />
        {!item.imageUrl && item.profile && <span className="sr-only">{initials(item.profile.name)}</span>}
        {item.live && (
          <span className="absolute bottom-1.5 left-1.5 inline-flex h-5 items-center gap-1 rounded-full bg-danger px-[7px] text-[10px] font-extrabold tracking-[0.3px] text-white">
            <span className="size-[5px] animate-pulse rounded-full bg-white" aria-hidden />
            AO VIVO
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-[5px]">
        <span className="flex min-w-0 items-baseline justify-between gap-2">
          <span className="truncate text-[15px] leading-5 font-bold text-text-strong">{item.title}</span>
          {right && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-[5px] text-xs leading-4 font-semibold whitespace-nowrap",
                right.cls,
              )}
            >
              <span className={cn("size-1.5 rounded-full", right.dotCls)} aria-hidden />
              {right.text}
            </span>
          )}
        </span>
        {(sub || item.sponsored) && (
          <span className="truncate text-[13px] leading-[18px] text-text-subtle">
            {sub}
            {item.sponsored && (
              <>
                {sub && " · "}
                <span className="text-border-strong">Patrocinado</span>
              </>
            )}
          </span>
        )}
        <span className="flex min-w-0 items-center gap-1 overflow-hidden text-xs leading-4 whitespace-nowrap text-text-muted">
          {item.rating !== null && item.reviewCount > 0 && (
            <>
              <Star className="size-3.5 shrink-0 fill-accent text-accent" aria-hidden />
              <span className="font-semibold text-text">{formatRating(item.rating)}</span>
              <span>({item.reviewCount})</span>
              {dot}
            </>
          )}
          <Where item={item} />
        </span>
        {item.price && (
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="text-base leading-[22px] font-extrabold text-text-strong">
              {formatMoney(item.price.amountCents)}
            </span>
            {item.price.oldAmountCents && pct > 0 && (
              <>
                <span className="text-xs text-border-strong line-through">
                  {formatMoney(item.price.oldAmountCents)}
                </span>
                <span className="inline-flex h-[18px] items-center rounded bg-accent px-1.5 text-[11px] font-extrabold text-on-accent">
                  -{pct}%
                </span>
              </>
            )}
            {item.price.unit && <span className="truncate text-xs text-text-subtle">{item.price.unit}</span>}
          </span>
        )}
        <Highlight item={item} />
      </span>
    </Link>
  );
}

export function ExplorarCardSkeleton() {
  return <div aria-hidden className="h-[220px] animate-pulse rounded-2xl bg-surface-3" />;
}
