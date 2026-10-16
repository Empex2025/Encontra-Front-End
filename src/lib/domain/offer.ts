/** Regras da página de oferta (/o/{slug}). */

/** Milissegundos que faltam até `endsAt`; zero se já passou. Data inválida: null (sem contagem, nunca "encerrada" por engano). */
export function msLeft(endsAt: string, now: number): number | null {
  const t = new Date(endsAt).getTime();
  return Number.isNaN(t) ? null : Math.max(0, t - now);
}

/** "Termina em HH:MM:SS"; acima de 48 h mostra dias para não exibir "120:00:00". */
export function countdownText(ms: number): string {
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  if (days >= 2) return `${days} dias`;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

/** Oferta encerrada: o servidor diz `ended`, ou o prazo já passou. */
export function offerEnded(status: "active" | "ended", ms: number | null): boolean {
  return status === "ended" || ms === 0;
}

/** Link do mapa. Coordenadas valem mais que endereço; sem nenhum dos dois, null (não inventa destino). */
export function routeUrl(o: {
  lat: number | null;
  lng: number | null;
  address: string | null;
}): string | null {
  if (o.lat !== null && o.lng !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`;
  }
  return o.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`
    : null;
}

const TZ = "America/Maceio";
const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hourMin = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long" });
const dayMonth = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" });

/** A oferta termina no mesmo dia (fuso de Maceió) de `now`, e ainda não terminou. Data inválida: false. */
export function endsToday(endsAt: string | null | undefined, now: number): boolean {
  if (!endsAt) return false;
  const t = new Date(endsAt).getTime();
  if (Number.isNaN(t) || t < now) return false;
  return dayKey.format(t) === dayKey.format(now);
}

/** "23h59" ou "22h" quando os minutos são zero. */
function hourText(t: number): string {
  const [h, m] = hourMin.format(t).split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

/**
 * Validade curta do cupom: "Hoje até 23h59", "Até quarta" (próximos 6 dias) ou "Até 24/10".
 * Data inválida: null (a tela não mostra validade em vez de inventar).
 */
export function couponUntilText(validUntil: string, now: number): string | null {
  const t = new Date(validUntil).getTime();
  if (Number.isNaN(t)) return null;
  if (dayKey.format(t) === dayKey.format(now)) return `Hoje até ${hourText(t)}`;
  const days = (t - now) / 86_400_000;
  if (days > 0 && days < 6) return `Até ${weekday.format(t).replace("-feira", "")}`;
  return `Até ${dayMonth.format(t)}`;
}

/** Cupom ainda não guardado mostra só o começo do código ("ESP•••••"); guardado mostra inteiro. */
export function maskCode(code: string, revealed: boolean): string {
  if (revealed || code.length <= 3) return code;
  return `${code.slice(0, 3)}${"•".repeat(Math.min(5, code.length - 3))}`;
}
