import type { Metadata } from "next";

import { ScreenPending } from "@/components/layout/screen-pending";

export const metadata: Metadata = { title: "Produto" };

export default function ProdutoPage() {
  return <ScreenPending title="Produto" purpose="Detalhes, preço, disponibilidade, onde comprar perto e contato direto com a loja." />;
}
