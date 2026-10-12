import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Prestador" };

export default function PrestadorPage() {
  return <ScreenPending title="Prestador" purpose="Perfil do prestador: serviços e preços, área atendida, avaliações e pedido de orçamento." />;
}
