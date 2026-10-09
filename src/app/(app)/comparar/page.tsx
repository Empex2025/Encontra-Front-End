import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Comparações" };

export default function CompararPage() {
  return (
    <ScreenPending
      title="Comparações"
      purpose="Pesquise, salve até 3 opções da mesma categoria e compare lado a lado."
    />
  );
}
