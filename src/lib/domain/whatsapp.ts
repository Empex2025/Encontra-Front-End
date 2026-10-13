import { formatMoney } from "@/lib/format";

/**
 * Mensagem pronta para a loja (Documento de entrega › Produto, regra da mensagem pronta):
 * "Olá, {loja}! Vi no EncontraÊ e tenho interesse no {título}[, tamanho {tam}], {qtd} unidade(s) ({preço}[ cada]). Ainda está disponível?"
 */
export function productMessage(p: {
  store: string;
  title: string;
  size?: string | null;
  quantity: number;
  priceCents: number | null;
}) {
  const plural = p.quantity > 1;
  const size = p.size ? `, tamanho ${p.size}` : "";
  const qty = `${p.quantity} unidade${plural ? "s" : ""}`;
  const price = p.priceCents !== null ? ` (${formatMoney(p.priceCents)}${plural ? " cada" : ""})` : "";
  return `Olá, ${p.store}! Vi no EncontraÊ e tenho interesse no ${p.title}${size}, ${qty}${price}. Ainda está disponível?`;
}

/** Perguntas prontas do Produto. */
export const QUICK_QUESTIONS = [
  "Ainda está disponível?",
  "Tem em outro tamanho?",
  "Posso retirar hoje?",
  "Aceita cartão?",
  "Qual o endereço?",
] as const;

/** Link do WhatsApp. `digits` = número só com dígitos e DDI; sem número válido não há link. */
export function whatsappUrl(digits: string | null, text: string): string | null {
  const n = (digits ?? "").replace(/\D/g, "");
  if (n.length < 10) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

/** Mensagem de abertura para uma loja, sem produto. */
export const storeMessage = (store: string) => `Olá, ${store}! Vi no EncontraÊ e gostaria de saber mais.`;

/** Mensagem para o prestador, com o serviço escolhido quando houver. */
export const providerMessage = (name: string, service?: string | null) =>
  service
    ? `Olá, ${name}! Vi no EncontraÊ e gostaria de um orçamento de ${service}.`
    : `Olá, ${name}! Vi no EncontraÊ e gostaria de um orçamento.`;
