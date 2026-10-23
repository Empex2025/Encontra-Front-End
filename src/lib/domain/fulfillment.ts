import { formatMoney } from "@/lib/format";

/** Como o cliente recebe: produto (entrega com valor/grátis ou só retirada) ou serviço (na casa do cliente, online). */
export type Fulfillment = {
  /** Produto: a loja entrega? Retirada na loja sempre existe. */
  delivers?: boolean | null;
  /** Valor da entrega ou da taxa de deslocamento, em centavos; 0 ou ausente com `delivers` = grátis. */
  feeCents?: number | null;
  /** Serviço: onde acontece além do local do prestador. */
  serviceVenue?: "home" | "online" | null;
};

export type FulfillmentLabel = { text: string; icon: "delivery" | "pickup" | "home" | "online" };

/** Texto curto para a linha da distância do cartão; `null` quando não há o que informar (nada aparece). */
export function fulfillmentLabel(f: Fulfillment | null | undefined, kind: "product" | "service"): FulfillmentLabel | null {
  if (!f) return null;
  if (kind === "service") {
    if (f.serviceVenue === "online") return { text: "Online", icon: "online" };
    if (f.serviceVenue === "home") {
      return { text: f.feeCents ? `Na sua casa · +${formatMoney(f.feeCents)}` : "Na sua casa", icon: "home" };
    }
    return null;
  }
  if (f.delivers === true) {
    return { text: f.feeCents ? `Entrega ${formatMoney(f.feeCents)}` : "Entrega grátis", icon: "delivery" };
  }
  if (f.delivers === false) return { text: "Só retirada", icon: "pickup" };
  return null;
}
