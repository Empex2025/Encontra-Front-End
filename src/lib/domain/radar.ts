import type { Prices, RadarItem, RadarKind } from "@/lib/api/radar";
import { RADAR_KINDS } from "@/lib/api/radar";
import { formatMoney } from "@/lib/format";

export const RADAR_KIND_LABEL: Record<RadarKind, string> = {
  new: "Novidades",
  price: "Preços",
  follow: "Quem sigo",
  alert: "Alertas",
};

/** Visitante só vê Novidades e Preços (Documento de entrega). */
export const radarTabs = (guest: boolean): ("all" | RadarKind)[] =>
  guest ? ["all", "new", "price"] : ["all", ...RADAR_KINDS];

/** Itens de tipos conhecidos, no máximo 8; tipos que o front não conhece são ignorados. */
export function visibleRadarItems(items: RadarItem[], guest: boolean): (RadarItem & { kind: RadarKind })[] {
  const allowed = new Set<string>(radarTabs(guest));
  return items.filter((i): i is RadarItem & { kind: RadarKind } => allowed.has(i.kind)).slice(0, 8);
}

export function filterRadar<T extends { kind: string }>(items: T[], tab: "all" | RadarKind): T[] {
  return tab === "all" ? items : items.filter((i) => i.kind === tab);
}

export function radarHeadline(unseen: number): string {
  if (unseen <= 0) return "Você está em dia";
  return `Seu radar encontrou ${unseen} ${unseen === 1 ? "novidade" : "novidades"}`;
}

/** "Acompanha: 4 lojas que você segue · 2 alertas · interesses: Moda, Casa". Parte zerada não aparece. */
export function trackingLine(t: { follows: number; alerts: number; interests: string[] }): string | null {
  const parts = [
    t.follows > 0 ? `${t.follows} ${t.follows === 1 ? "loja que você segue" : "lojas que você segue"}` : null,
    t.alerts > 0 ? `${t.alerts} ${t.alerts === 1 ? "alerta" : "alertas"}` : null,
    t.interests.length > 0 ? `interesses: ${t.interests.slice(0, 4).join(", ")}` : null,
  ].filter(Boolean);
  return parts.length ? `Acompanha: ${parts.join(" · ")}` : null;
}

/** Destino vindo do servidor: só caminho interno (uma "/" no início, nunca "//" nem esquema). */
export function safeInternalHref(href: string | null | undefined): string | null {
  if (!href || !href.startsWith("/") || href.startsWith("//") || href.includes("\\")) return null;
  return href;
}

export function priceChangeText(p: Prices["items"][number]): string | null {
  if (p.changePct === null || p.changePct === undefined || p.direction === "flat") return null;
  const n = Math.abs(p.changePct).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const arrow = p.direction === "down" ? "▼" : "▲";
  return `${arrow} ${n}%${p.period ? ` em ${p.period}` : ""}`;
}

export const priceValueText = (p: Prices["items"][number]) => formatMoney(p.valueCents);

export function growthText(pct: number | null | undefined): string | null {
  return pct && pct > 0 ? `+${Math.round(pct)}%` : null;
}
