import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { FavoritesView } from "@/components/favorites/favorites-view";

export const metadata: Metadata = { title: "Meus Favoritos", robots: { index: false, follow: false } };

export default function FavoritosPage() {
  return (
    <AuthGate area="favoritos">
      <Suspense>
        <FavoritesView />
      </Suspense>
    </AuthGate>
  );
}
