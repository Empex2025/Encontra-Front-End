import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OfferView } from "@/components/offer/offer-view";
import { offerMetadata } from "@/lib/domain/share-meta";
import { loadOffer } from "@/lib/server/public-pages";

export async function generateMetadata({ params }: PageProps<"/o/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await loadOffer(slug);
  return r.kind === "ok" ? offerMetadata(r.data.meta) : { title: "Oferta" };
}

export default async function OfertaPage({ params }: PageProps<"/o/[slug]">) {
  const { slug } = await params;
  const r = await loadOffer(slug);
  if (r.kind === "notfound") notFound();
  return <OfferView slug={slug} />;
}
