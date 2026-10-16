import type { Metadata } from "next";
import { Suspense } from "react";

import { InstitutionalShell } from "@/components/legal/institutional-shell";
import { ReportForm } from "@/components/report/report-form";
import { LEGAL_DOCS } from "@/lib/domain/legal-docs";

export const metadata: Metadata = { title: "Denunciar" };

const meta = LEGAL_DOCS.find((d) => d.doc === "denunciar")!;

export default function DenunciarPage() {
  return (
    <InstitutionalShell active="denunciar" title={meta.title} sub={meta.sub}>
      <Suspense
        fallback={
          <div
            aria-busy="true"
            aria-label="Carregando formulário de denúncia"
            className="h-96 animate-pulse rounded-2xl bg-surface-2"
          />
        }
      >
        <ReportForm />
      </Suspense>
    </InstitutionalShell>
  );
}
