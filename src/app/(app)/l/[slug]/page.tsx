import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfileView } from "@/components/catalog/profile-view";
import { jsonLdString, profileJsonLd, profileMetadata } from "@/lib/domain/share-meta";
import { loadProfile } from "@/lib/server/public-pages";

export async function generateMetadata({ params }: PageProps<"/l/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await loadProfile(slug);
  return r.kind === "ok" && r.data.meta.kind === "store" ? profileMetadata(r.data.meta) : { title: "Loja" };
}

export default async function LojaPage({ params }: PageProps<"/l/[slug]">) {
  const { slug } = await params;
  const r = await loadProfile(slug);
  if (r.kind === "notfound") notFound();
  return (
    <>
      {r.kind === "ok" && r.data.meta.kind === "store" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(profileJsonLd(r.data.meta)) }}
        />
      )}
      <ProfileView slug={slug} expected="store" />
    </>
  );
}
