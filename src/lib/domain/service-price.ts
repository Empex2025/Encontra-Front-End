import { formatMoney } from "@/lib/format";

/** Como o prestador cobra um serviço. `fixed`: valor certo · `from`: a partir de · `hour`/`unit`/`period`: por hora, unidade ou período ·
 *  `free`: grátis · `quote`: sob orçamento (descrever e receber o valor) · `combine`: valor combinado direto pelo chat. */
export type ServicePriceType = "fixed" | "from" | "hour" | "unit" | "period" | "free" | "quote" | "combine";

export type ServicePriceInput = {
  priceType?: ServicePriceType | null;
  priceCents?: number | null;
  /** "unidade", "dia", "ponto"… usado em `unit` e `period`. */
  unitLabel?: string | null;
  minCents?: number | null;
  /** Campo antigo: valor "a partir de". Vale quando `priceType` não vem. */
  fromCents?: number | null;
};

export type ServicePrice = {
  /** Texto pequeno antes do valor ("a partir de"); vazio quando não há. */
  prefix: string;
  /** Valor em destaque. */
  value: string;
  /** Texto pequeno depois do valor ("por hora", "mín. R$ 50,00"); vazio quando não há. */
  suffix: string;
  /** Rótulo do botão: o pedido pode ser orçamento, solicitação ou conversa para combinar. */
  action: "Pedir orçamento" | "Solicitar serviço" | "Combinar pelo chat";
};

export function servicePrice(s: ServicePriceInput): ServicePrice {
  const cents = s.priceCents ?? s.fromCents ?? null;
  const type: ServicePriceType = s.priceType ?? (s.fromCents != null ? "from" : "quote");
  const unit = s.unitLabel?.trim() || null;
  const min = s.minCents != null && s.minCents > 0 ? `mín. ${formatMoney(s.minCents)}` : "";
  if (type === "free") return { prefix: "", value: "Grátis", suffix: "", action: "Solicitar serviço" };
  if (type === "combine") return { prefix: "", value: "A combinar", suffix: "pelo chat", action: "Combinar pelo chat" };
  if (cents === null) return { prefix: "", value: "Sob orçamento", suffix: "", action: "Pedir orçamento" };
  const v = formatMoney(cents);
  if (type === "from") return { prefix: "a partir de", value: v, suffix: "", action: "Solicitar serviço" };
  if (type === "hour") return { prefix: "", value: v, suffix: ["por hora", min].filter(Boolean).join(" · "), action: "Solicitar serviço" };
  if (type === "unit") return { prefix: "", value: v, suffix: [`por ${unit ?? "unidade"}`, min].filter(Boolean).join(" · "), action: "Solicitar serviço" };
  if (type === "period") return { prefix: "", value: v, suffix: [`por ${unit ?? "dia"}`, min].filter(Boolean).join(" · "), action: "Solicitar serviço" };
  if (type === "quote") return { prefix: "", value: "Sob orçamento", suffix: "", action: "Pedir orçamento" };
  return { prefix: "", value: v, suffix: "", action: "Solicitar serviço" };
}
