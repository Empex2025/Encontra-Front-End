import type { Metadata } from "next";

import { AuthGate } from "@/components/auth/auth-gate";
import { ReviewForm } from "@/components/review/review-form";

export const metadata: Metadata = { title: "Avaliar", robots: { index: false, follow: false } };

export default async function AvaliarPage({ searchParams }: PageProps<"/avaliar">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return (
    <AuthGate area="avaliar">
      <ReviewForm tipo={one(sp.tipo)} id={one(sp.id)} />
    </AuthGate>
  );
}
