import type { Metadata } from "next";
import { Suspense } from "react";

import { ComparisonPicker } from "@/components/comparison/comparison-picker";

export const metadata: Metadata = {
  title: "Comparar",
  // Comparação é escolha pessoal, não conteúdo público.
  robots: { index: false, follow: true },
};

export default function CompararPage() {
  return (
    <Suspense>
      <ComparisonPicker />
    </Suspense>
  );
}
