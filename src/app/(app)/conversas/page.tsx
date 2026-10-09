import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Conversas" };

export default function ConversasPage() {
  return <ScreenPending title="Conversas" purpose="Suas conversas com lojas e prestadores." />;
}
