import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
  return <LegalView doc={doc} />;
}
