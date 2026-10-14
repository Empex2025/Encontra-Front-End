import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { LegalView } from "@/components/legal/legal-view";
import { LEGAL_DOCS } from "@/lib/domain/legal-docs";

type Props = { params: Promise<{ doc: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  return { title: LEGAL_DOCS.find((d) => d.doc === doc)?.label ?? "Institucional" };
}

export default async function InstitucionalDocPage({ params }: Props) {
  const { doc } = await params;
  if (doc === "denunciar") redirect("/denunciar");
  if (!LEGAL_DOCS.some((d) => d.doc === doc)) notFound();
  return <LegalView doc={doc} />;
}
