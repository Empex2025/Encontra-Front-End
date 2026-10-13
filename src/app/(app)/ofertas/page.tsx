import type { Metadata } from "next";

import { OffersView } from "@/components/offers/offers-view";

export const metadata: Metadata = { title: "Ofertas & Promoções" };

export default function OfertasPage() {
  return <OffersView />;
}
