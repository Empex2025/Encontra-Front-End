import type { StoryGroup } from "@/lib/api/discover";

/** Regras de Stories, Ao vivo e Evento (Documento de entrega › Fluxo 2). */

/** Um story dura 24 horas. */
export const STORY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Tira stories com mais de 24 h e grupos que ficaram sem story. Destaques do perfil são permanentes
 * e passam sem filtro. Data inválida é mantida (o servidor é quem manda; o front só impede o óbvio).
 */
export function activeStoryGroups(groups: StoryGroup[], now: number): StoryGroup[] {
  return groups
    .map((g) =>
      g.highlight
        ? g
        : {
            ...g,
            stories: g.stories.filter((s) => {
              const t = new Date(s.publishedAt).getTime();
              return Number.isNaN(t) || now - t < STORY_TTL_MS;
            }),
          },
    )
    .filter((g) => g.stories.length > 0);
}

export const STORY_SECONDS = 5;
export const REPLY_MAX = 300;
export const LIVE_MESSAGE_MAX = 200;
export const LIVE_MESSAGES_SHOWN = 40;
export const MAX_HEARTS = 12;
export const HEART_MS = 1700;

export type Pos = { g: number; s: number };

/** Próximo story; nas pontas muda de perfil. Passou do último: null (fim da volta). */
export function nextPos(sizes: number[], p: Pos): Pos | null {
  if (p.s + 1 < sizes[p.g]) return { g: p.g, s: p.s + 1 };
  if (p.g + 1 < sizes.length) return { g: p.g + 1, s: 0 };
  return null;
}

/** Story anterior; no 1º story do 1º perfil não faz nada (devolve a mesma posição). */
export function prevPos(sizes: number[], p: Pos): Pos {
  if (p.s > 0) return { g: p.g, s: p.s - 1 };
  if (p.g > 0) return { g: p.g - 1, s: 0 };
  return p;
}

/** Subtítulo do topo: depois da 1ª volta vira "Mais para você · por causa de {interesse 1} e {interesse 2}". */
export function storiesSubtitle(place: string, laps: number, interests: string[]) {
  if (laps >= 1 && interests.length > 0)
    return `Mais para você · por causa de ${interests.slice(0, 2).join(" e ")}`;
  return place ? `Stories perto de você · ${place}` : "Stories perto de você";
}

/** Resposta ao story: não vazia, até 300 caracteres. */
export const validReply = (t: string) => t.trim().length > 0 && t.length <= REPLY_MAX;

/** Rótulo do tag do story: tipo ou "Destaque", e km ou nome do destaque. */
export function storyMeta(
  g: { typeLabel: string | null; distanceKm: number | null; highlight: { name: string } | null },
  ago: string | null,
) {
  const first = g.highlight ? "Destaque" : (g.typeLabel ?? "Perfil");
  const second = g.highlight
    ? g.highlight.name
    : g.distanceKm !== null
      ? `${g.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`
      : null;
  return [first, second, ago].filter(Boolean).join(" · ");
}

/** "mm:ss", ou "h:mm:ss" a partir de 1 h. */
export function formatElapsed(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${String(m).padStart(2, "0")}:${ss}`;
}

/** Mensagens do chat da live: só as 40 últimas, sem repetir ids. */
export function mergeMessages<T extends { id: string }>(old: T[], incoming: T[]): T[] {
  const seen = new Set(old.map((m) => m.id));
  return [...old, ...incoming.filter((m) => !seen.has(m.id))].slice(-LIVE_MESSAGES_SHOWN);
}

/** Situação do evento em relação a `now`. */
export function eventWhen(startIso: string, endIso: string | null, now: Date = new Date()) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date(start.getTime() + 3 * 3600_000);
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(start) - day(now)) / 86_400_000);
  if (now >= start && now <= end) return { state: "now" as const, label: "Acontecendo agora" };
  if (now > end)
    return day(end) === day(now)
      ? { state: "past" as const, label: "Encerrado hoje" }
      : { state: "past" as const, label: "Já aconteceu" };
  if (days === 0) return { state: "soon" as const, label: "Hoje" };
  if (days === 1) return { state: "soon" as const, label: "É amanhã" };
  return { state: "future" as const, label: `Faltam ${days} dias` };
}

/** Selo do dia: "Hoje" ou o dia da semana, calculado da data (nunca fixo). */
export function eventDayBadge(startIso: string, now: Date = new Date()) {
  const s = new Date(startIso);
  const same = s.toDateString() === now.toDateString();
  if (same) return "Hoje";
  const wd = s.toLocaleDateString("pt-BR", { weekday: "long" });
  return wd.charAt(0).toUpperCase() + wd.slice(1);
}

/** Posição (grupo, story) de um story na fila, ou null se ele não está mais nela. */
export function findStoryPos(groups: StoryGroup[], storyId: string): { g: number; s: number } | null {
  for (let g = 0; g < groups.length; g++) {
    const s = groups[g].stories.findIndex((x) => x.id === storyId);
    if (s >= 0) return { g, s };
  }
  return null;
}

/** Iniciais para o círculo do perfil sem foto: "Brilho Limpezas" → "BL", "Hidro" → "HI". */
export function initials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const clock = (d: Date) =>
  d.getMinutes() === 0 ? `${d.getHours()}h` : `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`;
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** "Hoje, 19h às 23h" · "Amanhã, 19h" · "Sábado, 10/10, 19h às 22h". Tudo calculado da data do evento. */
export function eventWhenText(startIso: string, endIso: string | null, now: Date = new Date()) {
  const s = new Date(startIso);
  const e = endIso ? new Date(endIso) : null;
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(s) - day(now)) / 86_400_000);
  const range = e && !Number.isNaN(e.getTime()) ? `${clock(s)} às ${clock(e)}` : clock(s);
  if (days === 0) return `Hoje, ${range}`;
  if (days === 1) return `Amanhã, ${range}`;
  const wd = cap(s.toLocaleDateString("pt-BR", { weekday: "long" }));
  const dm = s.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${wd}, ${dm}, ${range}`;
}

/** Selo de situação do cartão "Quando": "Começa em 4 h" nas próximas 24 h; senão, a frase de `eventWhen`. */
export function eventChip(startIso: string, endIso: string | null, now: Date = new Date()) {
  const w = eventWhen(startIso, endIso, now);
  const ms = new Date(startIso).getTime() - now.getTime();
  if ((w.state === "soon" || w.state === "future") && ms > 0 && ms < 86_400_000) {
    const min = Math.ceil(ms / 60_000);
    return {
      state: w.state,
      label: min < 60 ? `Começa em ${min} min` : `Começa em ${Math.floor(min / 60)} h`,
    };
  }
  return w;
}
