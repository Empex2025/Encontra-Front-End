import type { Metadata } from "next";

import { ComparisonBoard } from "@/components/comparison/comparison-board";

export const metadata: Metadata = {
  title: "Comparar lado a lado",
  robots: { index: false, follow: true },
};

export default function CompararQuadroPage() {
  return <ComparisonBoard />;
}
