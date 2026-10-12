import { BadgeCheck, House, MapPin, Star } from "lucide-react";
import Link from "next/link";

import { cn } from "@/components/ui/cn";
import type { SearchItem } from "@/lib/api/search";
import { categoryById } from "@/lib/domain/categories";
import { discountPct, formatDayMonth, formatKm, formatMoney, formatRating } from "@/lib/format";
import { liveHref, lojaHref, prestadorHref, produtoHref } from "@/lib/routes";

const STATUS = {
  open: { label: "Aberto agora", dot: "bg-success", text: "text-success-text" },
  soon: { label: "Fecha em breve", dot: "bg-accent-hover", text: "text-accent-text" },
  closed: { label: "Fechado", dot: "bg-danger", text: "text-danger-text" },
} as const;

const TYPE_LABEL = { product: "Produto", service: "Serviço", place: "Lugar" } as const;

/** Destino do card (Documento de entrega › Explorar, regra 18). */
export function resultHref(item: SearchItem) {
  if (item.live) return liveHref(item.live.id);
  if (item.type === "product") return produtoHref(item.slug);
  if (item.type === "service" && item.profile) return prestadorHref(item.profile.slug);
  if (item.profile)
    return item.profile.kind === "provider" ? prestadorHref(item.profile.slug) : lojaHref(item.profile.slug);
  return produtoHref(item.slug);
}

export function ResultCard({ item, onOpen }: { item: SearchItem; onOpen?: () => void }) {
  const cat = item.categoryId ? categoryById(item.categoryId) : undefined;
  const CatIcon = cat?.icon;
  const pct = item.price ? discountPct(item.price.amountCents, item.price.oldAmountCents) : 0;
  const priceDate = item.price?.updatedAt ? formatDayMonth(item.price.updatedAt) : null;
  const status = item.status ? STATUS[item.status] : null;
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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow hover:shadow-raised">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
          <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center" style={{ color: cat?.colorVar }}>
            {CatIcon && <CatIcon className="size-10 opacity-80" aria-hidden />}
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {item.live && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger px-2.5 py-1 text-xs font-bold text-white">
              <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              Ao vivo
            </span>
          )}
          {pct > 0 && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-on-accent">
              -{pct}%
            </span>
          )}
        </div>
        {item.sponsored && (
          <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            Patrocinado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <p className="text-xs font-semibold text-text-subtle">
          {TYPE_LABEL[item.type]}
          {cat && <span> · {cat.name}</span>}
        </p>
        <h3 className="line-clamp-2 text-base leading-6 font-bold text-text-strong">
          <Link
            href={resultHref(item)}
            onClick={onOpen}
            className="group-has-[:focus-visible]:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {item.title}
          </Link>
        </h3>
        {item.profile && (
          <p className="flex items-center gap-1 truncate text-sm text-text-muted">
            <span className="truncate">{item.profile.name}</span>
            {item.profile.verified && (
              <BadgeCheck className="size-4 shrink-0 text-link" aria-label="Identidade verificada" />
            )}
          </p>
        )}

        {item.price && (
          <div className="flex flex-wrap items-baseline gap-x-2">
            {item.price.unit && <span className="text-xs text-text-subtle">{item.price.unit}</span>}
            <span className="text-lg font-bold text-text-strong">{formatMoney(item.price.amountCents)}</span>
            {item.price.oldAmountCents && pct > 0 && (
              <span className="text-sm text-text-subtle line-through">
                {formatMoney(item.price.oldAmountCents)}
              </span>
            )}
            {priceDate && (
              <span className="w-full text-xs text-text-subtle">Preço informado em {priceDate}</span>
            )}
          </div>
        )}

        {highlight && (
          <p className={cn("self-start rounded-md px-2 py-1 text-xs font-semibold", highlight.cls)}>
            {highlight.text}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-1 pt-1 text-sm">
          <p className="flex items-center gap-1 text-text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {item.distanceKm !== null ? (
              <span>
                {formatKm(item.distanceKm)}
                {item.neighborhood && ` · ${item.neighborhood}`}
              </span>
            ) : (
              <span>{item.neighborhood ? `${item.neighborhood} · ` : ""}distância indisponível</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {item.live ? (
              <span className="text-xs font-semibold text-danger-text">{item.live.viewers} assistindo</span>
            ) : (
              status && (
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", status.text)}>
                  <span className={cn("size-2 rounded-full", status.dot)} aria-hidden />
                  {status.label}
                </span>
              )
            )}
            {item.rating !== null && item.reviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                <Star className="size-3.5 fill-accent text-accent" aria-hidden />
                <span className="font-semibold text-text">{formatRating(item.rating)}</span>
                <span>({item.reviewCount})</span>
                <span className="sr-only">avaliações</span>
              </span>
            )}
            {item.type === "service" && item.homeService && highlight?.text !== "Atende em casa" && (
              <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                <House className="size-3.5" aria-hidden />
                Atende em casa
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ResultCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="aspect-[4/3] bg-surface-2" />
      <div className="flex flex-col gap-2 p-3.5">
        <div className="h-3 w-1/3 rounded bg-surface-2" />
        <div className="h-4 w-4/5 rounded bg-surface-2" />
        <div className="h-4 w-1/2 rounded bg-surface-2" />
        <div className="mt-2 h-3 w-2/3 rounded bg-surface-2" />
      </div>
    </div>
  );
}
