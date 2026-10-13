import type { Metadata } from "next";

import { ProductView } from "@/components/catalog/product-view";

export const metadata: Metadata = { title: "Produto" };

export default async function ProdutoPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}
