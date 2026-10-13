import type { Metadata } from "next";

import { AuthGate } from "@/components/auth/auth-gate";
import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Minha Conta" };

export default function ContaPage() {
  return (
    <AuthGate area="conta">
      <ScreenPending
        title="Minha Conta"
        purpose="Seus dados, onde você busca, interesses, avisos, privacidade e configurações."
      />
    </AuthGate>
  );
}
