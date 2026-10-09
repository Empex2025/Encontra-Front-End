import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Ofertas & Promoções" };

export default function OfertasPage() {
  return (
    <ScreenPending
      title="Ofertas & Promoções"
      purpose="Cupons do dia, menores preços e ofertas perto de você, com filtros e alerta."
    />
  );
}
