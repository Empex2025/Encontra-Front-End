import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar", robots: { index: false, follow: true } };

export default function EntrarPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
