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
