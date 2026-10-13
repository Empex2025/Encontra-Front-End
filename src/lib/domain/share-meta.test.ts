import { describe, expect, it } from "vitest";

import { jsonLdString, productJsonLd, productMetadata, profileMetadata } from "./share-meta";

const product = {
  slug: "tenis-x",
  title: "Tênis X",
  description: "Leve",
  price: { amountCents: 19990 },
  storeName: "Loja A",
  neighborhood: "Farol",
  imageUrl: "https://img/x.jpg",
};

describe("share-meta", () => {
  it("produto: preço · loja · bairro e imagem", () => {
    const m = productMetadata(product);
    expect(m.description).toMatch(/199,90 · Loja A · Farol/);
    expect(m.alternates?.canonical).toBe("/p/tenis-x");
    expect((m.openGraph as { images?: unknown[] }).images).toHaveLength(1);
  });
  it("produto sem imagem não declara imagem", () => {
    const m = productMetadata({ ...product, imageUrl: null });
    expect((m.openGraph as { images?: unknown }).images).toBeUndefined();
    expect((m.twitter as { card: string }).card).toBe("summary");
  });
  it("loja e prestador usam formatos diferentes", () => {
    const base = {
      slug: "x",
      name: "X",
      categoryLabel: "Moda",
      rating: 4.8,
      neighborhood: "Farol",
      city: "Maceió",
      fromCents: null,
      bio: null,
      imageUrl: null,
    };
    expect(profileMetadata({ ...base, kind: "store" }).description).toBe("Moda · 4,8 · Farol, Maceió");
    expect(profileMetadata({ ...base, kind: "provider", fromCents: 5000 }).description).toMatch(
      /Moda · a partir de .*50,00 · 4,8/,
    );
    expect(profileMetadata({ ...base, kind: "provider" }).alternates?.canonical).toBe("/s/x");
  });
  it("JSON-LD: sem preço não declara oferta; sem avaliações não declara nota", () => {
    const ld = productJsonLd({ ...product, price: null, stock: "unknown", rating: 4.5, reviewCount: 0 });
    expect(ld).not.toHaveProperty("offers");
    expect(ld).not.toHaveProperty("aggregateRating");
    const ld2 = productJsonLd({ ...product, stock: "available", rating: 4.5, reviewCount: 3 }) as {
      offers: { price: string; availability: string };
    };
    expect(ld2.offers.price).toBe("199.90");
    expect(ld2.offers.availability).toBe("https://schema.org/InStock");
  });
  it("JSON-LD escapa </script>", () => {
    expect(jsonLdString({ a: "</script><b>" })).not.toContain("<");
  });
});

import { offerMetadata } from "./share-meta";
describe("offerMetadata", () => {
  it("oferta encerrada não é indexada; ativa sim", () => {
    const base = {
      slug: "o1",
      title: "20% off",
      description: "só hoje",
      storeName: "Loja A",
      imageUrl: null,
    };
    expect(offerMetadata({ ...base, status: "ended" }).robots).toEqual({ index: false, follow: true });
    expect(offerMetadata({ ...base, status: "active" }).robots).toBeUndefined();
    expect(offerMetadata({ ...base, status: "active" }).description).toBe("Loja A · só hoje");
  });
});
