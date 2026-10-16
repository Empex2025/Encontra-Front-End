/** Regras do chat (Documento de entrega › Conversas). */
export const MESSAGE_MAX = 500;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const mb = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Erro de anexo ou null. Só imagem JPG/PNG/WEBP, até 5 MB. */
export function validateChatImage(file: { type: string; size: number }): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type))
    return "Esse arquivo não é uma foto. Escolha uma imagem (JPG, PNG ou WEBP).";
  if (file.size > IMAGE_MAX_BYTES)
    return `A foto tem ${mb.format(file.size / 1024 / 1024)} MB e o limite é 5 MB. Escolha uma imagem menor.`;
  return null;
}

export const clipMessage = (s: string) => s.slice(0, MESSAGE_MAX);

/** "Enviar" só com texto ou foto; nunca vazio. */
export const canSend = (text: string, hasImage: boolean) => text.trim().length > 0 || hasImage;

/** Prévia da última mensagem na lista. */
export function previewText(c: {
  blocked: boolean;
  last: { text: string | null; hasImage: boolean; mine: boolean } | null;
}): string {
  if (c.blocked) return "Você bloqueou esta loja";
  const l = c.last;
  if (!l) return "Nenhuma mensagem ainda";
  const body = l.hasImage ? (l.text ? `📷 ${l.text}` : "📷 Foto") : (l.text ?? "");
  return `${l.mine ? "Você: " : ""}${body}`;
}

export const REPORT_REASONS = [
  { id: "scam", label: "Golpe ou fraude" },
  { id: "prohibited", label: "Produto proibido ou falsificado" },
  { id: "harassment", label: "Assédio ou ofensa" },
  { id: "spam", label: "Spam" },
  { id: "other", label: "Outro" },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]["id"];

const TZ = "America/Maceio";
const hhmm = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const ddmm = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: TZ });
const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: TZ });
// Maceió é UTC−3 o ano todo: o dia civil é o dia do instante deslocado em 3 h.
const civilDay = (d: Date) => Math.floor((d.getTime() - 3 * 3600_000) / 86_400_000);

/** Hora na lista de conversas (protótipo): hoje "10:16", ontem "ontem", até 6 dias "qua", antes "28/09". */
export function listTimeLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = civilDay(now) - civilDay(d);
  if (diff <= 0) return hhmm.format(d);
  if (diff === 1) return "ontem";
  if (diff <= 6) return weekday.format(d).replace(".", "");
  return ddmm.format(d);
}

/** Erros da denúncia por campo. "Outro" exige o relato (até 400). */
export function validateReport(reason: ReportReason | null, details: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!reason) e.reason = "Escolha um motivo para continuar.";
  else if (reason === "other" && !details.trim()) e.details = "Conte em poucas palavras o que aconteceu.";
  if (details.length > 400) e.details = "Use até 400 caracteres.";
  return e;
}
