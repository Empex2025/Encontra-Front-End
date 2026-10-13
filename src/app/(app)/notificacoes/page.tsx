import type { Metadata } from "next";

import { AuthGate } from "@/components/auth/auth-gate";
import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Notificações" };

export default function NotificacoesPage() {
  return (
    <AuthGate area="notificacoes">
      <ScreenPending
        title="Notificações"
        purpose="Avisos de preço, cupons, lojas que você segue e sua atividade."
      />
    </AuthGate>
  );
}
