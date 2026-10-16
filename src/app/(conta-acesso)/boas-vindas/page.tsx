import type { Metadata } from "next";
import { Suspense } from "react";

import { WelcomeSlides } from "@/components/auth/welcome-slides";

export const metadata: Metadata = { title: "Boas-vindas", robots: { index: false, follow: true } };

export default function BoasVindasPage() {
  return (
    <Suspense>
      <WelcomeSlides />
    </Suspense>
  );
}
