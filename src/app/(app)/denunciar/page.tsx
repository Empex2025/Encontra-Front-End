import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportForm } from "@/components/report/report-form";

export const metadata: Metadata = { title: "Denunciar" };

export default function DenunciarPage() {
  return (
    <Suspense
      fallback={
        <div
          aria-busy="true"
          aria-label="Carregando formulário de denúncia"
          className="mx-auto h-96 max-w-xl animate-pulse rounded-2xl bg-surface-2"
        />
      }
    >
      <ReportForm />
    </Suspense>
  );
}
