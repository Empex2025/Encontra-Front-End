import type { AlertChannel, AlertCondition } from "@/lib/api/actions";
import { formatMoney } from "@/lib/format";

export const CONDITION_LABEL: Record<AlertCondition, { label: string; hint?: string }> = {
  restock: { label: "Voltar ao estoque" },
  price_drop: { label: "O preço baixar", hint: "Quando ficar mais barato do que hoje" },
  promo: { label: "Entrar em promoção" },
  other_store: { label: "Outra loja perto cadastrar" },
};
export const CHANNEL_LABEL: Record<AlertChannel, string> = {
  site: "No site",
  whatsapp: "WhatsApp",
  email: "E-mail",
};
export const RADIUS_OPTIONS = [5, 10, 20] as const;

export type AlertDraft = {
  conditions: AlertCondition[];
  belowReais: string;
  size: string | null;
  radiusKm: (typeof RADIUS_OPTIONS)[number];
  channels: AlertChannel[];
};

/** Erro de formulário ou null. Pelo menos uma condição e um canal. */
export function validateAlert(d: AlertDraft): string | null {
  if (d.conditions.length === 0) return "Escolha pelo menos uma opção em “Me avise quando”.";
  if (d.channels.length === 0) return "Escolha por onde quer ser avisado.";
  return null;
}

/** Valor em centavos de "Só me avise abaixo de R$ ___" (até 5 dígitos); vazio = sem teto. Só vale com "preço baixar". */
export function belowCents(d: Pick<AlertDraft, "conditions" | "belowReais">): number | undefined {
  if (!d.conditions.includes("price_drop")) return undefined;
  const digits = d.belowReais.replace(/\D/g, "").slice(0, 5);
  const n = Number(digits);
  return digits && n > 0 ? n * 100 : undefined;
}

export function summarizeAlert(a: {
  conditions: AlertCondition[];
  size: string | null;
  city: string | null | undefined;
  radiusKm: number;
  channels: AlertChannel[];
  belowCents: number | null;
}) {
  const conds = a.conditions
    .map((c) =>
      c === "price_drop" && a.belowCents
        ? `o preço ficar abaixo de ${formatMoney(a.belowCents)}`
        : CONDITION_LABEL[c].label.toLowerCase(),
    )
    .join(", ");
  const place = [a.size ? `Tamanho ${a.size}` : null, `${a.city ? `${a.city} · ` : ""}até ${a.radiusKm} km`]
    .filter(Boolean)
    .join(", ");
  return `Vamos te avisar quando: ${conds}. ${place}. Aviso por: ${a.channels.map((c) => CHANNEL_LABEL[c]).join(", ")}.`;
}
