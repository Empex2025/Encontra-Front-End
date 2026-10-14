import type { Metadata } from "next";

import { formatMoney } from "@/lib/format";

/**
 * Prévia dos links (Open Graph) e dados estruturados das páginas públicas.
 * Só usa o que o servidor devolveu: sem imagem, sem preço ou sem nota, a parte simplesmente não aparece.
 * Formato das descrições: Documento de entrega › Compartilhado › Prévia Open Graph.
 */

const join = (parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join(" · ");
const clip = (s: string, n = 200) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

type Img = string | null | undefined;
const images = (url: Img) => (url ? [{ url }] : undefined);

export type ProductMetaInput = {
  slug: string;
  title: string;
  description: string | null;
  price: { amountCents: number } | null;
  storeName: string;
  neighborhood: string | null;
  imageUrl: Img;
};

export function productMetadata(p: ProductMetaInput): Metadata {
  const description = clip(
    join([p.price ? formatMoney(p.price.amountCents) : null, p.storeName, p.neighborhood]) ||
      p.description ||
      "",
  );
  return {
    title: p.title,
    description: description || undefined,
    alternates: { canonical: `/p/${encodeURIComponent(p.slug)}` },
    openGraph: {
      type: "website",
      title: p.title,
      description: description || undefined,
      images: images(p.imageUrl),
    },
    twitter: {
      card: p.imageUrl ? "summary_large_image" : "summary",
      title: p.title,
      description: description || undefined,
    },
  };
}

export type ProfileMetaInput = {
  slug: string;
  kind: "store" | "provider";
  name: string;
  categoryLabel: string | null;
  rating: number | null;
  neighborhood: string | null;
  city: string | null;
  fromCents: number | null;
  bio: string | null;
  imageUrl: Img;
};

export function profileMetadata(p: ProfileMetaInput): Metadata {
  const place = join([p.neighborhood, p.city]).replace(" · ", ", ");
  const rating = p.rating ? p.rating.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : null;
  const description = clip(
    p.kind === "store"
      ? join([p.categoryLabel, rating, place])
      : join([p.categoryLabel, p.fromCents ? `a partir de ${formatMoney(p.fromCents)}` : null, rating]),
  );
  const d = description || p.bio || undefined;
  const path = `${p.kind === "store" ? "/l" : "/s"}/${encodeURIComponent(p.slug)}`;
  return {
    title: p.name,
    description: d ? clip(d) : undefined,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: p.name,
      description: d ? clip(d) : undefined,
      images: images(p.imageUrl),
    },
    twitter: {
      card: p.imageUrl ? "summary_large_image" : "summary",
      title: p.name,
      description: d ? clip(d) : undefined,
    },
  };
}

/** JSON-LD de produto. Só campos reais; sem preço não declara oferta. */
export function productJsonLd(
  p: ProductMetaInput & {
    stock: "available" | "unavailable" | "unknown";
    rating: number | null;
    reviewCount: number;
  },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    ...(p.description ? { description: p.description } : {}),
    ...(p.imageUrl ? { image: [p.imageUrl] } : {}),
    ...(p.price
      ? {
          offers: {
            "@type": "Offer",
            price: (p.price.amountCents / 100).toFixed(2),
            priceCurrency: "BRL",
            ...(p.stock === "unknown"
              ? {}
              : { availability: `https://schema.org/${p.stock === "available" ? "InStock" : "OutOfStock"}` }),
            seller: { "@type": "Organization", name: p.storeName },
          },
        }
      : {}),
    ...(p.rating && p.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount } }
      : {}),
  };
}

export function profileJsonLd(p: ProfileMetaInput & { street: string | null; reviewCount: number }) {
  return {
    "@context": "https://schema.org",
    "@type": p.kind === "store" ? "LocalBusiness" : "ProfessionalService",
    name: p.name,
    ...(p.imageUrl ? { image: p.imageUrl } : {}),
    ...(p.street || p.neighborhood || p.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(p.street ? { streetAddress: p.street } : {}),
            ...(p.neighborhood ? { addressRegion: p.neighborhood } : {}),
            ...(p.city ? { addressLocality: p.city } : {}),
            addressCountry: "BR",
          },
        }
      : {}),
    ...(p.rating && p.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount } }
      : {}),
  };
}

/** Texto seguro para dentro de <script type="application/ld+json">: "<" não pode fechar a tag. */
export const jsonLdString = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

export type OfferMetaInput = {
  slug: string;
  title: string;
  description: string | null;
  storeName: string;
  status: "active" | "ended";
  imageUrl: Img;
};

/** Oferta: "{loja} · {texto}". Oferta encerrada não deve ser indexada. */
export function offerMetadata(o: OfferMetaInput): Metadata {
  const description = clip(join([o.storeName, o.description]));
  return {
    title: o.title,
    description: description || undefined,
    alternates: { canonical: `/o/${encodeURIComponent(o.slug)}` },
    robots: o.status === "ended" ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title: o.title,
      description: description || undefined,
      images: images(o.imageUrl),
    },
    twitter: {
      card: o.imageUrl ? "summary_large_image" : "summary",
      title: o.title,
      description: description || undefined,
    },
  };
}
