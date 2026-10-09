import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <ScreenPending title="Entrar" purpose="Entre com CPF ou e-mail e senha, ou continue como visitante." />
  );
}
