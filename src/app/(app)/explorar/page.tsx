import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Explorar" };

export default function ExplorarPage() {
  return (
    <ScreenPending
      title="Explorar"
      purpose="Encontre o que você procura ou descubra o que está acontecendo perto de você, em lista ou no mapa."
    />
  );
}
