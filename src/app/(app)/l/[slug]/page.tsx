import type { Metadata } from "next";

import { ProfileView } from "@/components/catalog/profile-view";

export const metadata: Metadata = { title: "Loja" };

export default async function LojaPage({ params }: PageProps<"/l/[slug]">) {
  const { slug } = await params;
  return <ProfileView slug={slug} expected="store" />;
}
