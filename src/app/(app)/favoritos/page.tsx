import type { Metadata } from "next";
import { Suspense } from "react";

import { FavoritesView } from "@/components/favorites/favorites-view";

export const metadata: Metadata = { title: "Meus Favoritos", robots: { index: false, follow: false } };

/** A tela decide sozinha o que mostrar a visitante: estrutura completa + convite para entrar. */
export default function FavoritosPage() {
  return (
    <Suspense>
      <FavoritesView />
    </Suspense>
  );
}
