import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SharedListView } from "@/components/lists/shared-list-view";
import { loadSharedList } from "@/lib/server/public-pages";

/** Lista de pessoa: nunca indexada em buscadores. A prévia mostra só o nome da lista. */
export async function generateMetadata({ params }: PageProps<"/listas/[token]">): Promise<Metadata> {
  const { token } = await params;
  const r = await loadSharedList(token);
  const robots = { index: false, follow: false };
  return r.kind === "ok" ? { title: r.data.name, robots } : { title: "Lista compartilhada", robots };
}

export default async function ListaPublicaPage({ params }: PageProps<"/listas/[token]">) {
  const { token } = await params;
  const r = await loadSharedList(token);
  if (r.kind === "notfound") notFound();
  return <SharedListView token={token} />;
}
