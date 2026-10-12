import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Ao vivo" };

export default function AoVivoPage() {
  return <ScreenPending title="Ao vivo" purpose="Assistir à live da loja, com chat e produtos em destaque." />;
}
