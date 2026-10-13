import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata: Metadata = { title: "Notificações", robots: { index: false, follow: false } };

export default function NotificacoesPage() {
  return (
    <AuthGate area="notificacoes">
      <Suspense>
        <NotificationsView />
      </Suspense>
    </AuthGate>
  );
}
