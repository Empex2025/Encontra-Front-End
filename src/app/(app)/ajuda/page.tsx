import type { Metadata } from "next";
import { Suspense } from "react";

import { HelpView } from "@/components/help/help-view";

export const metadata: Metadata = { title: "Central de Ajuda" };

export default function AjudaPage() {
  return (
    <Suspense fallback={null}>
      <HelpView />
    </Suspense>
  );
}
