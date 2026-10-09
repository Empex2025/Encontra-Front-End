import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Minha Conta" };

export default function ContaPage() {
  return (
    <ScreenPending
      title="Minha Conta"
      purpose="Seus dados, onde você busca, interesses, avisos, privacidade e configurações."
    />
  );
}
