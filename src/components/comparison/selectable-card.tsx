"use client";

import { BadgeCheck, House, MapPin, Play, Star, Store } from "lucide-react";
import Link from "next/link";

import { cn } from "@/components/ui/cn";
import type { SearchItem } from "@/lib/api/search";
import { categoryById } from "@/lib/domain/categories";
import { discountPct, formatKm, formatMoney, formatRating } from "@/lib/format";
import { lojaHref, prestadorHref, produtoHref } from "@/lib/routes";

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

const compact = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const kcount = (n: number) => (n >= 1000 ? `${compact.format(n / 1000)}k` : String(n));

const Dot = () => (
  <span aria-hidden className="mx-0.5 text-border-strong">
    ·
  </span>
);

const metaLine = "flex min-w-0 items-center gap-1 text-xs leading-4 whitespace-nowrap text-text-muted";

export function itemHref(item: Pick<SearchItem, "type" | "slug" | "profile">) {
  if (item.type === "product") return produtoHref(item.slug);
  if (item.profile)
    return item.profile.kind === "provider" ? prestadorHref(item.profile.slug) : lojaHref(item.profile.slug);
  return produtoHref(item.slug);
}

/**
 * Cartão de produto ou serviço no formato do protótipo para as telas que escolhem ou guardam itens (Comparar,
 * Favoritos): foto com espaço para botões nos cantos, e o mesmo corpo do cartão de resultado. `topLeft` e
 * `topRight` são os botões sobre a foto; `extra` entra dentro do cartão, entre o rodapé da loja e a borda.
 * Só mostra o que o servidor trouxe: sem dado, a linha some.
 */
export function SelectableCard({
  item,
  imageHeight,
  topLeft,
  topRight,
  middle,
  extra,
  highlight,
  onOpen,
}: {
  item: SearchItem;
  imageHeight: number;
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  /** Entra antes do rodapé da loja (ex.: o que mudou e "Salvo há…" nos Favoritos). */
  middle?: React.ReactNode;
  extra?: React.ReactNode;
  /** Contorno âmbar (item que já está na comparação). */
  highlight?: boolean;
  onOpen?: () => void;
}) {
  const cat = item.categoryId ? categoryById(item.categoryId) : undefined;
  const CatIcon = cat?.icon;
  const service = item.type === "service";
  const href = itemHref(item);
  const pct = item.price ? discountPct(item.price.amountCents, item.price.oldAmountCents) : 0;
  const hasRating = item.rating !== null && item.reviewCount > 0;
  const status = !service && item.status ? STATUS[item.status] : null;
  const modeLabel = item.homeService ? "Atende em domicílio" : item.serviceNote ? "Atende no local" : null;

  return (
    <article
      className={cn(
        "card group relative flex min-w-0 flex-col gap-3 rounded-2xl bg-surface p-2 pb-3 shadow-raised transition duration-150 hover:-translate-y-0.5 hover:shadow-pop",
        highlight && "outline-2 outline-accent",
      )}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-lg bg-primary text-white/90"
        style={{ height: imageHeight, ...(cat ? { background: cat.colorVar } : {}) }}
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
        {topLeft && <span className="absolute top-2.5 left-2.5 z-[2]">{topLeft}</span>}
        {topRight && <span className="absolute top-2.5 right-2.5 z-[2]">{topRight}</span>}
        {typeof item.viewCount === "number" && (
          <span className="absolute bottom-2.5 left-2.5 z-[2] inline-flex h-[22px] items-center gap-1 rounded-full bg-black/30 px-2 text-[11px] font-semibold text-white">
            <Play className="size-2.5 fill-white" aria-hidden />
            {kcount(item.viewCount)}
            <span className="sr-only">visualizações</span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 px-1">
        {service && cat && CatIcon && (
          <span className="inline-flex h-6 max-w-full items-center gap-1.5 self-start overflow-hidden rounded-full bg-selected pr-2.5 pl-2 text-xs leading-4 font-bold whitespace-nowrap text-text-strong">
            <CatIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{cat.name}</span>
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="truncate text-sm leading-5 font-medium text-text">
            <Link href={href} onClick={onOpen} title={item.title} className="hover:underline">
              {item.title}
            </Link>
          </h3>
          {service && item.specialties && item.specialties.length > 0 && (
            <span className="truncate text-xs leading-4 text-text-subtle">
              {item.specialties.join(" • ")}
            </span>
          )}
        </div>

        {item.price ? (
          service ? (
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              {item.price.unit && (
                <span className="text-xs leading-4 text-text-muted">{item.price.unit}</span>
              )}
              <span className="text-xl leading-7 font-bold text-text-strong">
                {formatMoney(item.price.amountCents)}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-1.5 whitespace-nowrap">
              {item.price.oldAmountCents && pct > 0 && (
                <>
                  <span className="text-xs leading-4 text-text-subtle line-through">
                    {formatMoney(item.price.oldAmountCents)}
                  </span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] leading-4 font-extrabold text-on-accent">
                    {pct}% OFF
                  </span>
                </>
              )}
              <span className="text-lg leading-7 font-bold text-text-strong">
                {formatMoney(item.price.amountCents)}
              </span>
            </div>
          )
        ) : item.offerText ? (
          <span className="self-start rounded-md bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-text">
            {item.offerText}
          </span>
        ) : (
          <span className="text-xs leading-4 text-text-subtle">Preço sob consulta</span>
        )}

        <div className="flex flex-col gap-1.5">
          {hasRating && (
            <p className={metaLine}>
              {hasRating && (
                <>
                  <Star className="size-3.5 shrink-0 fill-accent text-accent" aria-hidden />
                  <span className="font-semibold text-text">{formatRating(item.rating as number)}</span>
                  <span>({item.reviewCount} avaliações)</span>
                </>
              )}
            </p>
          )}
          <p className={metaLine}>
            <MapPin className="size-3.5 shrink-0 fill-accent-hover text-accent-hover" aria-hidden />
            {item.distanceKm !== null ? (
              <>
                <span className="font-semibold text-text">{formatKm(item.distanceKm)}</span>
                {item.neighborhood && (
                  <>
                    <Dot />
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
          {service && modeLabel && (
            <p className={metaLine}>
              {item.homeService ? (
                <House className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <Store className="size-3.5 shrink-0" aria-hidden />
              )}
              <span className="font-bold text-text">{modeLabel}</span>
              {item.serviceNote && (
                <>
                  <Dot />
                  <span className="truncate">{item.serviceNote}</span>
                </>
              )}
            </p>
          )}
        </div>

        {middle}
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
                  title={`Ver perfil de ${item.profile.name}`}
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
        {extra}
      </div>
    </article>
  );
}

/** Etiqueta branca "Produto" / "Serviço" no canto da foto. */
export function TypeTag({ type }: { type: SearchItem["type"] }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-white px-2.5 text-xs font-bold text-navy">
      {type === "service" ? "Serviço" : type === "place" ? "Lugar" : "Produto"}
    </span>
  );
}
