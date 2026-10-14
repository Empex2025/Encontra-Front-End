import type { Metadata } from "next";

import { ConversationsView } from "@/components/chat/conversations-view";

export const metadata: Metadata = { title: "Conversas", robots: { index: false, follow: false } };

export default async function ConversaPage({ params }: PageProps<"/conversas/[id]">) {
  const { id } = await params;
  return <ConversationsView activeId={id} />;
}
