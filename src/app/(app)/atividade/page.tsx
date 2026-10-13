import type { Metadata } from "next";
import { Suspense } from "react";

import { ActivityView } from "@/components/activity/activity-view";
import { AuthGate } from "@/components/auth/auth-gate";

export const metadata: Metadata = { title: "Minha atividade", robots: { index: false, follow: false } };

export default function AtividadePage() {
  return (
    <AuthGate area="atividade">
      <Suspense>
        <ActivityView />
      </Suspense>
    </AuthGate>
  );
}
