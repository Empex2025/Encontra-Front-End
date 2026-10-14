import type { Metadata } from "next";
import { Suspense } from "react";

import { ActivityView } from "@/components/activity/activity-view";

export const metadata: Metadata = { title: "Minha atividade", robots: { index: false, follow: false } };

/** A tela decide sozinha o que mostrar a visitante: estrutura completa + convite para entrar. */
export default function AtividadePage() {
  return (
    <Suspense>
      <ActivityView />
    </Suspense>
  );
}
