import type { Metadata } from "next";

import { RecoverWizard } from "@/components/auth/recover-wizard";

export const metadata: Metadata = { title: "Recuperar senha", robots: { index: false, follow: true } };

export default function RecuperarPage() {
  return <RecoverWizard />;
}
