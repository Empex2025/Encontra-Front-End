/** Agrupamento da lista de notificações: Agora (< 1 h), Hoje, Ontem, Esta semana (até 7 dias) e Mais antigas. */
export type NotificationGroupId = "now" | "today" | "yesterday" | "week" | "older";
export const GROUP_LABEL: Record<NotificationGroupId, string> = {
  now: "Agora",
  today: "Hoje",
  yesterday: "Ontem",
  week: "Esta semana",
  older: "Mais antigas",
};
const ORDER: NotificationGroupId[] = ["now", "today", "yesterday", "week", "older"];

// Fuso do produto (Maceió, UTC−3, sem horário de verão): "hoje" é o dia civil nesse fuso.
const dayKey = (d: Date) => Math.floor((d.getTime() - 3 * 3600_000) / 86_400_000);

export function groupOf(iso: string, now: Date = new Date()): NotificationGroupId | null {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  if (now.getTime() - t.getTime() < 3600_000 && t.getTime() <= now.getTime()) return "now";
  const diff = dayKey(now) - dayKey(t);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff <= 7) return "week";
  return "older";
}

/** Grupos na ordem Agora → Mais antigas, cada um do mais novo para o mais antigo. Itens com data inválida ficam fora. */
export function groupNotifications<T extends { createdAt: string }>(
  items: readonly T[],
  now: Date = new Date(),
) {
  const map = new Map<NotificationGroupId, T[]>();
  for (const it of items) {
    const g = groupOf(it.createdAt, now);
    if (!g) continue;
    map.set(g, [...(map.get(g) ?? []), it]);
  }
  return ORDER.filter((g) => map.has(g)).map((g) => ({
    id: g,
    label: GROUP_LABEL[g],
    items: [...map.get(g)!].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }));
}

/** O servidor decide o destino; o front só segue caminhos internos (nada de `//host` ou `http:`). */
export function safeInternalHref(href: string | null | undefined): string | null {
  if (!href || !href.startsWith("/") || href.startsWith("//") || href.includes("\\")) return null;
  return href;
}
