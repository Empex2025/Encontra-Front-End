import type { Metadata } from "next";
import { Suspense } from "react";

import { ExplorarView } from "@/components/search/explorar-view";

export async function generateMetadata({ searchParams }: PageProps<"/explorar">): Promise<Metadata> {
  const q = (await searchParams).q;
  const term = typeof q === "string" ? q.trim() : "";
  return {
    title: term ? `“${term}” perto de você` : "Explorar",
    description: "Encontre produtos, serviços e lojas perto de você e fale direto com quem vende.",
    // Resultados de busca interna não são indexados (evita páginas finas e duplicadas).
    robots: term ? { index: false, follow: true } : undefined,
  };
}

export default function ExplorarPage() {
  return (
    <Suspense>
      <ExplorarView />
    </Suspense>
  );
}
