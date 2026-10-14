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
