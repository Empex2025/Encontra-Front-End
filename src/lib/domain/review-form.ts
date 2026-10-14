/** Regras de "Avaliar" (Documento de entrega › Avaliar). */
export const MIN_PHOTOS = 2;
export const MAX_PHOTOS = 6;
export const MAX_VIDEO_SECONDS = 60;
export const COMMENT_MAX = 1500;
export const PHOTO_TYPES = ["image/jpeg", "image/png"] as const;
export const VIDEO_TYPES = ["video/mp4"] as const;
export const MEDIA_MAX_BYTES = 50 * 1024 * 1024;

export const RATING_LABEL = ["Sem nota", "Péssimo", "Ruim", "Regular", "Bom", "Incrível"] as const;

export const NEGATIVE_HIGHLIGHTS = [
  "Qualidade abaixo do esperado",
  "Diferente do anunciado",
  "Preço alto",
  "Atendimento ruim",
  "Demorou a responder",
  "Difícil de encontrar",
] as const;
export const POSITIVE_HIGHLIGHTS = [
  "Boa qualidade",
  "Igual ao anunciado",
  "Preço justo",
  "Atendimento atencioso",
  "Respondeu rápido",
  "Fácil de encontrar",
  "Recomendo",
] as const;

/** Notas 1–2 mostram destaques negativos; sem nota ou 3–5, positivos. */
export const highlightsFor = (rating: number) => (rating >= 1 && rating <= 2 ? NEGATIVE_HIGHLIGHTS : POSITIVE_HIGHLIGHTS);
const isNegative = (rating: number) => rating >= 1 && rating <= 2;

/** Cruzar a fronteira ≤2 ↔ ≥3 limpa os destaques marcados; dentro do mesmo lado, mantém. */
export function nextHighlights(current: string[], from: number, to: number): string[] {
  return isNegative(from) === isNegative(to) ? current : [];
}

export type ReviewDraft = { rating: number; photos: number; uploading: boolean };

/** Erros por campo (só mostrados após a 1ª tentativa de publicar). */
export function validateReview(d: ReviewDraft): Record<string, string> {
  const e: Record<string, string> = {};
  if (d.rating < 1 || d.rating > 5) e.rating = "Escolha uma nota de 1 a 5 estrelas.";
  if (d.photos < MIN_PHOTOS) e.photos = `Adicione pelo menos ${MIN_PHOTOS} fotos (faltam ${MIN_PHOTOS - d.photos}).`;
  return e;
}

export function validatePhoto(f: { type: string; size: number }): string | null {
  if (!(PHOTO_TYPES as readonly string[]).includes(f.type)) return "Use fotos JPG ou PNG.";
  if (f.size > MEDIA_MAX_BYTES) return "A foto é grande demais. Escolha uma menor.";
  return null;
}
export function validateVideo(f: { type: string; size: number }, seconds: number | null): string | null {
  if (!(VIDEO_TYPES as readonly string[]).includes(f.type)) return "Use um vídeo MP4.";
  if (f.size > MEDIA_MAX_BYTES) return "O vídeo é grande demais. Escolha um menor.";
  if (seconds === null || !Number.isFinite(seconds)) return "Não foi possível ler o vídeo. Tente outro arquivo.";
  if (seconds > MAX_VIDEO_SECONDS) return `O vídeo tem mais de ${MAX_VIDEO_SECONDS} segundos. Escolha um mais curto.`;
  return null;
}

/** "Primeiro nome + inicial do último sobrenome." ("Kaio Mendes" → "Kaio M."); desligado = "Cliente anônimo". */
export function displayName(fullName: string | null | undefined, show: boolean): string {
  if (!show) return "Cliente anônimo";
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Cliente anônimo";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export const extraColor = (n: number) => (n <= 2 ? "danger" : n === 3 ? "warning" : "success");

export const draftKey = (tipo: string, id: string) => `encontrae_rascunho_avaliacao:${tipo}:${id}`;
