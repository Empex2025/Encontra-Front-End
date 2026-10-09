import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Meus Favoritos" };

export default function FavoritosPage() {
  return (
    <ScreenPending
      title="Meus Favoritos"
      purpose="O que você salvou e acompanha: itens, lojas e prestadores que segue, listas e alertas."
    />
  );
}
