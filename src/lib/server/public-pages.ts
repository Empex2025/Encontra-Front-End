import { z } from "zod";

import { profileSchema, productSchema } from "@/lib/api/catalog";
import type { OfferMetaInput, ProductMetaInput, ProfileMetaInput } from "@/lib/domain/share-meta";

import { publicGet, type PublicResult } from "./public-api";

const seg = encodeURIComponent;

/** Só o que a prévia usa. `passthrough` não é necessário: campos a mais são descartados. */
const productMetaSchema = productSchema
  .pick({
    slug: true,
    title: true,
    description: true,
    price: true,
    media: true,
    stock: true,
    rating: true,
    reviewCount: true,
  })
  .extend({
    profile: z.object({ name: z.string() }),
    location: z.object({ neighborhood: z.string().nullable() }),
  });

const profileMetaSchema = profileSchema
  .pick({
    slug: true,
    kind: true,
    name: true,
    categoryLabel: true,
    bio: true,
    avatarUrl: true,
    coverUrl: true,
  })
  .extend({
    stats: z.object({ rating: z.number().nullable(), reviewCount: z.number() }),
    address: z
      .object({
        street: z.string().nullable(),
        neighborhood: z.string().nullable(),
        city: z.string().nullable(),
      })
      .nullable(),
    provider: z.object({ services: z.array(z.object({ fromCents: z.number().nullable() })) }).nullable(),
  });

export async function loadProduct(slug: string): Promise<
  PublicResult<{
    meta: ProductMetaInput & {
      stock: "available" | "unavailable" | "unknown";
      rating: number | null;
      reviewCount: number;
    };
  }>
> {
  const r = await publicGet(`/products/${seg(slug)}`, productMetaSchema);
  if (r.kind !== "ok") return r;
  const p = r.data;
  const img = p.media.find((m) => m.type === "image")?.url ?? p.media[0]?.posterUrl ?? null;
  return {
    kind: "ok",
    data: {
      meta: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        price: p.price,
        storeName: p.profile.name,
        neighborhood: p.location.neighborhood,
        imageUrl: img,
        stock: p.stock.state,
        rating: p.rating,
        reviewCount: p.reviewCount,
      },
    },
  };
}

export async function loadProfile(
  slug: string,
): Promise<PublicResult<{ meta: ProfileMetaInput & { street: string | null; reviewCount: number } }>> {
  const r = await publicGet(`/profiles/${seg(slug)}`, profileMetaSchema);
  if (r.kind !== "ok") return r;
  const p = r.data;
  const prices = (p.provider?.services ?? [])
    .map((s) => s.fromCents)
    .filter((n): n is number => n !== null && n > 0);
  return {
    kind: "ok",
    data: {
      meta: {
        slug: p.slug,
        kind: p.kind,
        name: p.name,
        categoryLabel: p.categoryLabel,
        rating: p.stats.rating,
        neighborhood: p.address?.neighborhood ?? null,
        city: p.address?.city ?? null,
        street: p.address?.street ?? null,
        fromCents: prices.length ? Math.min(...prices) : null,
        bio: p.bio,
        imageUrl: p.coverUrl ?? p.avatarUrl,
        reviewCount: p.stats.reviewCount,
      },
    },
  };
}

const offerMetaSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  status: z.enum(["active", "ended"]),
  profile: z.object({ name: z.string() }),
});

export async function loadOffer(slug: string): Promise<PublicResult<{ meta: OfferMetaInput }>> {
  const r = await publicGet(`/offers/${seg(slug)}`, offerMetaSchema);
  if (r.kind !== "ok") return r;
  const o = r.data;
  return {
    kind: "ok",
    data: {
      meta: {
        slug: o.slug,
        title: o.title,
        description: o.description,
        storeName: o.profile.name,
        status: o.status,
        imageUrl: o.imageUrl,
      },
    },
  };
}
