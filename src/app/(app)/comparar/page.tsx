import type { Metadata } from "next";

import { ComparisonPicker } from "@/components/comparison/comparison-picker";
import { ComparisonBoard } from "@/components/comparison/comparison-board";

export const metadata: Metadata = {
  title: "Comparar",
  // Comparação é escolha pessoal, não conteúdo público.
  robots: { index: false, follow: true },
};

export default function CompararPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <h1 className="text-2xl font-bold text-text-strong">Comparar</h1>
      <ComparisonPicker />
      <ComparisonBoard />
    </div>
  );
}
