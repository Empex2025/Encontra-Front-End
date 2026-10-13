import type { Metadata } from "next";

import { AuthGate } from "@/components/auth/auth-gate";
import { ConversationsView } from "@/components/chat/conversations-view";

export const metadata: Metadata = { title: "Conversas", robots: { index: false, follow: false } };

export default async function ConversaPage({ params }: PageProps<"/conversas/[id]">) {
  const { id } = await params;
  return (
    <AuthGate area="conversas">
      <ConversationsView activeId={id} />
    </AuthGate>
  );
}
