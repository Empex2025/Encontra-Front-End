import type { Metadata } from "next";

import { VisitorGuide } from "@/components/auth/visitor-guide";

export const metadata: Metadata = { title: "Modo visitante" };

export default function VisitantePage() {
  return <VisitorGuide />;
}
