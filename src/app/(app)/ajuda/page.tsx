import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Central de Ajuda" };

export default function AjudaPage() {
  return <ScreenPending title="Central de Ajuda" purpose="Perguntas frequentes e fale conosco." />;
}
