import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Minha atividade" };

export default function AtividadePage() {
  return (
    <ScreenPending
      title="Minha atividade"
      purpose="Orçamentos, pedidos de promoção, avaliações, cupons pegos e vistos recentemente."
    />
  );
}
