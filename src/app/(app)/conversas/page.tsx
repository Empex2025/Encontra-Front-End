import type { Metadata } from "next";

import { AuthGate } from "@/components/auth/auth-gate";
import { ConversationsView } from "@/components/chat/conversations-view";

export const metadata: Metadata = { title: "Conversas", robots: { index: false, follow: false } };

export default function ConversasPage() {
  return (
    <AuthGate area="conversas">
      <ConversationsView />
    </AuthGate>
  );
}
