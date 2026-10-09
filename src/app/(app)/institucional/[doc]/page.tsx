import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Institucional" };

export default function InstitucionalPage() {
  return (
    <ScreenPending
      title="Institucional"
      purpose="Como funciona, termos de uso, privacidade, cookies, regras de avaliação e denúncia."
    />
  );
}
