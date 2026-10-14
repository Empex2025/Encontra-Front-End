import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductView } from "@/components/catalog/product-view";
import { jsonLdString, productJsonLd, productMetadata } from "@/lib/domain/share-meta";
import { loadProduct } from "@/lib/server/public-pages";

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await loadProduct(slug);
  return r.kind === "ok" ? productMetadata(r.data.meta) : { title: "Produto" };
}

export default async function ProdutoPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const r = await loadProduct(slug);
  if (r.kind === "notfound") notFound();
  return (
    <>
      {r.kind === "ok" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd(r.data.meta)) }}
        />
      )}
      <ProductView slug={slug} />
    </>
  );
}
