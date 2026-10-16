"use client";

import { BadgeCheck, Clock, MapPin, Share2, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ShareButton } from "@/components/catalog/share-button";
import { cn } from "@/components/ui/cn";
import type { OfferItem } from "@/lib/api/catalog";
import { categoryById } from "@/lib/domain/categories";
import { endsToday } from "@/lib/domain/offer";
import { discountPct, formatKm, formatMoney, formatRating } from "@/lib/format";
import { denunciarHref, lojaHref, prestadorHref, produtoHref } from "@/lib/routes";

const STATUS = {
  open: {
    label: "Aberta agora",
    dot: "bg-success",
    cls: "border-success/30 bg-success-soft text-success-text",
  },
  soon: {
    label: "Fecha em breve",
    dot: "bg-accent-hover",
    cls: "border-accent-border bg-accent-soft text-accent-text",
  },
  closed: { label: "Fechada", dot: "bg-danger", cls: "border-danger/30 bg-danger-soft text-danger-text" },
} as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Para onde o card leva: produto/serviço da oferta (o link do perfil fica no rodapé). */
function offerHref(item: OfferItem) {
  if (item.type === "product") return produtoHref(item.slug);
  if (item.profile)
    return item.profile.kind === "provider" ? prestadorHref(item.profile.slug) : lojaHref(item.profile.slug);
  return produtoHref(item.slug);
}

/**
 * Card de oferta (protótipo › Ofertas): foto de 180 px com selo de desconto, compartilhar e "Acaba hoje";
 * título, preço (ou o texto da promoção), nota + validade, distância, loja e se está aberta.
 * Só mostra o que o servidor trouxe: sem dado, a linha some.
 */
export function OfferCard({ item, onOpen }: { item: OfferItem; onOpen?: () => void }) {
  const [now] = useState(() => Date.now());
  const cat = item.categoryId ? categoryById(item.categoryId) : undefined;
  const CatIcon = cat?.icon;
  const pct = item.price ? discountPct(item.price.amountCents, item.price.oldAmountCents) : 0;
  const tag = pct > 0 ? `${pct}% OFF` : "Oferta";
  const href = offerHref(item);
  const hasRating = item.rating !== null && item.reviewCount > 0;
  const status = item.status ? STATUS[item.status] : null;
  const sharePath = item.offerSlug ? `/o/${encodeURIComponent(item.offerSlug)}` : produtoHref(item.slug);
  const sharePrice = item.price ? ` por ${formatMoney(item.price.amountCents)}` : "";

  // Preço grande: o valor; sem valor, o texto da promoção. A nota ao lado: unidade ou o texto da promoção.
  const priceText = item.price ? formatMoney(item.price.amountCents) : item.offerText;
  const note = item.price ? (item.price.unit ?? (pct === 0 ? item.offerText : null)) : null;

  return (
    <article className="card group relative flex min-w-0 flex-col gap-3 rounded-2xl bg-surface p-2 pb-3 shadow-raised transition duration-150 hover:-translate-y-0.5 hover:shadow-pop">
      <div
        className="relative flex h-[180px] items-center justify-center overflow-hidden rounded-lg bg-primary text-white/90"
        style={cat ? { background: cat.colorVar } : undefined}
      >
        {CatIcon && <CatIcon className="size-12" aria-hidden />}
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <Link
          href={href}
          onClick={onOpen}
          aria-label={`Ver ${item.title}`}
          className="absolute inset-0 z-[1]"
        />
        <span className="absolute top-2.5 left-2.5 z-[2] inline-flex h-[26px] items-center rounded-full bg-accent px-2.5 text-xs font-extrabold text-on-accent shadow-card">
          {tag}
        </span>
        <span className="absolute top-2.5 right-2.5 z-[2]">
          <ShareButton
            path={sharePath}
            title={`${item.title}${sharePrice}`}
            noun="oferta"
            report={denunciarHref("produto", item.slug)}
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                aria-label={`Compartilhar ${item.title}`}
                title="Compartilhar"
                className="flex size-[34px] items-center justify-center rounded-full bg-surface text-text-strong shadow-card transition-transform hover:scale-110"
              >
                <Share2 className="size-4" aria-hidden />
              </button>
            )}
          />
        </span>
        {endsToday(item.endsAt, now) && (
          <span className="absolute bottom-2.5 left-2.5 z-[2] inline-flex h-6 items-center gap-1 rounded-full bg-danger-text px-2 text-[11px] font-bold text-white">
            <Clock className="size-3" aria-hidden />
            Acaba hoje
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 px-1">
        <h3 className="truncate text-sm leading-5 font-medium text-text">
          <Link href={href} onClick={onOpen} title={item.title} className="hover:underline">
            {item.title}
          </Link>
        </h3>
        {(priceText || item.price?.oldAmountCents) && (
          <div className="flex flex-wrap items-baseline gap-x-1.5 whitespace-nowrap">
            {item.price?.oldAmountCents && pct > 0 && (
              <span className="text-xs leading-4 text-text-subtle line-through">
                {formatMoney(item.price.oldAmountCents)}
              </span>
            )}
            {priceText && <span className="text-lg leading-7 font-bold text-text-strong">{priceText}</span>}
            {note && <span className="text-xs text-text-muted">{note}</span>}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          {(hasRating || item.scheduleLabel) && (
            <p className="flex min-w-0 items-center gap-1 text-xs leading-4 whitespace-nowrap text-text-muted">
              {hasRating && (
                <>
                  <Star className="size-3.5 shrink-0 fill-accent text-accent" aria-hidden />
                  <span className="font-semibold text-text">{formatRating(item.rating as number)}</span>
                  <span>({item.reviewCount})</span>
                  <span className="sr-only">avaliações</span>
                </>
              )}
              {hasRating && item.scheduleLabel && (
                <span aria-hidden className="mx-0.5 text-border-strong">
                  ·
                </span>
              )}
              {item.scheduleLabel && (
                <>
                  <Clock className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{item.scheduleLabel}</span>
                </>
              )}
            </p>
          )}
          <p className="flex min-w-0 items-center gap-1 text-xs leading-4 whitespace-nowrap text-text-muted">
            <MapPin className="size-3.5 shrink-0 fill-accent-hover text-accent-hover" aria-hidden />
            {item.distanceKm !== null ? (
              <>
                <span className="font-semibold text-text">{formatKm(item.distanceKm)}</span>
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
        </div>
        {item.profile && (
          <>
            <div className="h-px bg-surface-3" />
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {item.profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- fotos de perfil vêm de armazenamento externo
                  <img
                    src={item.profile.avatarUrl}
                    alt=""
                    className="size-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary"
                    style={cat ? { background: cat.colorVar } : undefined}
                  >
                    {initials(item.profile.name)}
                  </span>
                )}
                <Link
                  href={
                    item.profile.kind === "provider"
                      ? prestadorHref(item.profile.slug)
                      : lojaHref(item.profile.slug)
                  }
                  className="truncate text-xs leading-4 font-semibold text-text hover:underline"
                >
                  {item.profile.name} <span className="font-bold text-link">›</span>
                </Link>
                {item.profile.verified && (
                  <BadgeCheck className="size-3.5 shrink-0 text-link" aria-label="Identidade verificada" />
                )}
              </div>
              {status && (
                <span
                  className={cn(
                    "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded border px-2 text-[11px] leading-4 font-bold whitespace-nowrap",
                    status.cls,
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden />
                  {status.label}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
