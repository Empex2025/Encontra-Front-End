import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterWizard } from "@/components/auth/register-wizard";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false, follow: true } };

export default function CadastroPage() {
  return (
    <Suspense>
      <RegisterWizard />
    </Suspense>
  );
}
