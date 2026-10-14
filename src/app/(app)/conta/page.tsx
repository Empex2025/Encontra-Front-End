import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountView } from "@/components/account/account-view";
import { AuthGate } from "@/components/auth/auth-gate";

export const metadata: Metadata = { title: "Minha Conta" };

export default function ContaPage() {
  return (
    <AuthGate area="conta">
      <Suspense fallback={null}>
        <AccountView />
      </Suspense>
    </AuthGate>
  );
}
