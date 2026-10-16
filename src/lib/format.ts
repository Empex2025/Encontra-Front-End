const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const km1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dayMonth = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Maceio",
});

export const formatMoney = (cents: number) => brl.format(cents / 100);
export const formatKm = (km: number) => `${km1.format(km)} km`;
export const formatRating = (r: number) => km1.format(r);
export const formatDayMonth = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : dayMonth.format(d);
};

/** % de desconto = arredondado de (1 − preço / preço antigo) × 100. */
export const discountPct = (cents: number, oldCents: number | null) =>
  oldCents && oldCents > cents ? Math.round((1 - cents / oldCents) * 100) : 0;

const int = new Intl.NumberFormat("pt-BR");
/** 1249 → "1.249" (milhar com ponto, como no protótipo do produto). */
export const formatInt = (n: number) => int.format(n);

const compact = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
/** 12400 → "12,4 mil"; abaixo de 1.000 fica o número inteiro. */
export const formatCount = (n: number) => (n >= 1000 ? `${compact.format(n / 1000)} mil` : String(n));

/** "há 3 dias", "há 2 meses"… a partir de uma data ISO. Data inválida → null. */
export function formatTimeAgo(iso: string, now: Date = new Date()): string | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const min = Math.max(0, Math.floor((now.getTime() - t) / 60000));
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} ${d === 1 ? "dia" : "dias"}`;
  const m = Math.floor(d / 30);
  if (m < 12) return `há ${m} ${m === 1 ? "mês" : "meses"}`;
  const y = Math.floor(m / 12);
  return `há ${y} ${y === 1 ? "ano" : "anos"}`;
}
