import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Início" };

export default function HomePage() {
  return (
    <ScreenPending
      title="Início"
      purpose="Busca em destaque, Meu Radar, o que está acontecendo perto, produtos, serviços e o que está em alta."
    />
  );
}
