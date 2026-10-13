import type { Metadata } from "next";

import { ProfileView } from "@/components/catalog/profile-view";

export const metadata: Metadata = { title: "Prestador" };

export default async function PrestadorPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  return <ProfileView slug={slug} expected="provider" />;
}
