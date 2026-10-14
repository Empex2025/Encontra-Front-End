import type { Metadata } from "next";
import { Suspense } from "react";

import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata: Metadata = { title: "Notificações", robots: { index: false, follow: false } };

/** A tela decide sozinha o que mostrar a visitante: estrutura completa + convite para entrar. */
export default function NotificacoesPage() {
  return (
    <Suspense>
      <NotificationsView />
    </Suspense>
  );
}
