import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Loja" };

export default function LojaPage() {
  return <ScreenPending title="Loja" purpose="Perfil da loja: fotos, produtos, ofertas, avaliações, horários e contato." />;
}
