import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfileView } from "@/components/catalog/profile-view";
import { jsonLdString, profileJsonLd, profileMetadata } from "@/lib/domain/share-meta";
import { loadProfile } from "@/lib/server/public-pages";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await loadProfile(slug);
  return r.kind === "ok" && r.data.meta.kind === "provider"
    ? profileMetadata(r.data.meta)
    : { title: "Prestador" };
}

export default async function PrestadorPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const r = await loadProfile(slug);
  if (r.kind === "notfound") notFound();
  return (
    <>
      {r.kind === "ok" && r.data.meta.kind === "provider" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(profileJsonLd(r.data.meta)) }}
        />
      )}
      <ProfileView slug={slug} expected="provider" />
    </>
  );
}
