import type { Metadata } from "next";

import { LiveView } from "@/components/live/live-view";

export const metadata: Metadata = { title: "Ao vivo" };

export default async function AoVivoPage({ params }: PageProps<"/ao-vivo/[id]">) {
  const { id } = await params;
  return <LiveView id={id} />;
}
