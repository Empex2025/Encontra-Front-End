import { formatDayMonth, formatTimeAgo } from "@/lib/format";

/**
 * Sinais de confiança (DIRETRIZES §9 e §13, Fase 2): verificado, atualizado em, disponibilidade informada.
 * Regra: só afirmamos o que o servidor mandou. Campo ausente vira "Não informado" (nunca um valor inventado)
 * e informação da loja é sempre apresentada como "informada pela loja", nunca como verdade atual.
 */
export type SignalTone = "ok" | "neutral" | "unknown";
export type Signal = { label: string; value: string; tone: SignalTone; hint?: string };

const NOT_INFORMED = "Não informado";

export function verificationSignal(v: "verified" | "pending" | "none" | undefined): Signal {
  if (v === "verified") return { label: "Verificação", value: "Verificado", tone: "ok" };
  if (v === "pending") return { label: "Verificação", value: "Em análise", tone: "neutral" };
  if (v === "none") return { label: "Verificação", value: "Não verificado", tone: "neutral" };
  return { label: "Verificação", value: NOT_INFORMED, tone: "unknown" };
}

export function cnpjSignal(v: boolean | undefined): Signal {
  if (v === true) return { label: "CNPJ", value: "Verificado", tone: "ok" };
  if (v === false) return { label: "CNPJ", value: "Não verificado", tone: "neutral" };
  return { label: "CNPJ", value: NOT_INFORMED, tone: "unknown" };
}

/** "há 3 dias (12/10)"; data ausente ou inválida → null. */
export function updatedText(iso: string | null | undefined, now: Date = new Date()): string | null {
  if (!iso) return null;
  const ago = formatTimeAgo(iso, now);
  const day = formatDayMonth(iso);
  if (!ago || !day) return null;
  return `${ago} (${day})`;
}

export function priceSignal(price: { updatedAt: string | null } | null, now: Date = new Date()): Signal {
  if (!price) {
    return { label: "Preço", value: NOT_INFORMED, tone: "unknown", hint: "A loja não informou o preço." };
  }
  const when = updatedText(price.updatedAt, now);
  return when
    ? { label: "Preço", value: `Informado pela loja ${when}`, tone: "neutral" }
    : {
        label: "Preço",
        value: "Informado pela loja",
        tone: "neutral",
        hint: "Data da atualização não informada.",
      };
}

export function stockSignal(
  stock: { state: "available" | "unavailable" | "unknown"; updatedAt?: string | null },
  now: Date = new Date(),
): Signal {
  if (stock.state === "unknown") {
    return {
      label: "Disponibilidade",
      value: NOT_INFORMED,
      tone: "unknown",
      hint: "Pergunte à loja antes de ir.",
    };
  }
  const value =
    stock.state === "available" ? "Informada pela loja: disponível" : "Informada pela loja: indisponível";
  const when = updatedText(stock.updatedAt, now);
  return {
    label: "Disponibilidade",
    value,
    tone: "neutral",
    hint: when ? `Atualizada ${when}.` : "Sem data de atualização. Confirme com a loja antes de ir.",
  };
}

export function updatedSignal(label: string, iso: string | null | undefined, now: Date = new Date()): Signal {
  const when = updatedText(iso, now);
  return when
    ? { label, value: when.charAt(0).toUpperCase() + when.slice(1), tone: "neutral" }
    : { label, value: NOT_INFORMED, tone: "unknown" };
}

export function textSignal(label: string, value: string | number | null | undefined, suffix = ""): Signal {
  return value === null || value === undefined || value === ""
    ? { label, value: NOT_INFORMED, tone: "unknown" }
    : { label, value: `${value}${suffix}`, tone: "neutral" };
}
