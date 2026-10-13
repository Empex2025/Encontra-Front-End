import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportForm } from "@/components/report/report-form";

export const metadata: Metadata = { title: "Denunciar" };

export default function DenunciarPage() {
  return (
    <Suspense fallback={null}>
      <ReportForm />
    </Suspense>
  );
}
