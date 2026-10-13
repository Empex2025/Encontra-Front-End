import type { Metadata } from "next";

import { AuthGate } from "@/components/auth/auth-gate";
import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Conversas" };

export default function ConversasPage() {
  return (
    <AuthGate area="conversas">
      <ScreenPending title="Conversas" purpose="Suas conversas com lojas e prestadores." />
    </AuthGate>
  );
}
