import type { Metadata } from "next";

import { ConversationsView } from "@/components/chat/conversations-view";

export const metadata: Metadata = { title: "Conversas", robots: { index: false, follow: false } };

/** A tela decide sozinha o que mostrar a visitante: estrutura completa + convite para entrar. */
export default function ConversasPage() {
  return <ConversationsView />;
}
