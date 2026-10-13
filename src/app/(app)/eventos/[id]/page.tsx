import type { Metadata } from "next";

import { HappeningView } from "@/components/happening/happening-view";

export const metadata: Metadata = { title: "Evento" };

export default async function EventoPage({ params }: PageProps<"/eventos/[id]">) {
  const { id } = await params;
  return <HappeningView id={id} />;
}
