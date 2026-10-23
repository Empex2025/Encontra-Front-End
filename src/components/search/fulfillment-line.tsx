import { Bike, Globe, Home, Store } from "lucide-react";

import { fulfillmentLabel } from "@/lib/domain/fulfillment";
import type { SearchItem } from "@/lib/api/search";

const ICON = { delivery: Bike, pickup: Store, home: Home, online: Globe } as const;

/** "· 🛵 Entrega R$ 10" ao lado da distância do cartão. Não renderiza nada sem informação do servidor. */
export function FulfillmentLine({ item }: { item: SearchItem }) {
  if (item.type === "place") return null;
  const l = fulfillmentLabel(item.fulfillment, item.type === "service" ? "service" : "product");
  if (!l) return null;
  const Icon = ICON[l.icon];
  return (
    <>
      <span aria-hidden className="mx-0.5 text-border-strong">
        ·
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 font-semibold whitespace-nowrap text-text-2">
        <Icon className="size-3.5 text-text-muted" aria-hidden />
        {l.text}
      </span>
    </>
  );
}
