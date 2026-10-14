import { describe, expect, it } from "vitest";

import {
  eventDayBadge,
  eventWhen,
  formatElapsed,
  mergeMessages,
  nextPos,
  prevPos,
  storiesSubtitle,
  storyMeta,
  validReply,
} from "./discover";

describe("stories", () => {
  const sizes = [2, 1, 3];
  it("avança e muda de perfil nas pontas", () => {
    expect(nextPos(sizes, { g: 0, s: 0 })).toEqual({ g: 0, s: 1 });
    expect(nextPos(sizes, { g: 0, s: 1 })).toEqual({ g: 1, s: 0 });
    expect(nextPos(sizes, { g: 2, s: 2 })).toBeNull();
  });
  it("voltar no 1º story do 1º perfil não faz nada", () => {
    expect(prevPos(sizes, { g: 0, s: 0 })).toEqual({ g: 0, s: 0 });
    expect(prevPos(sizes, { g: 1, s: 0 })).toEqual({ g: 0, s: 0 });
    expect(prevPos(sizes, { g: 0, s: 1 })).toEqual({ g: 0, s: 0 });
  });
  it("subtítulo muda depois da 1ª volta", () => {
    expect(storiesSubtitle("Maceió - AL", 0, ["Moda", "Pet"])).toBe("Stories perto de você · Maceió - AL");
    expect(storiesSubtitle("Maceió - AL", 1, ["Moda", "Pet", "Auto"])).toBe(
      "Mais para você · por causa de Moda e Pet",
    );
    expect(storiesSubtitle("Maceió - AL", 1, [])).toBe("Stories perto de você · Maceió - AL");
  });
  it("resposta: não vazia e até 300", () => {
    expect(validReply("  ")).toBe(false);
    expect(validReply("oi")).toBe(true);
    expect(validReply("a".repeat(301))).toBe(false);
  });
  it("destaque troca tipo e km", () => {
    expect(storyMeta({ typeLabel: "Moda", distanceKm: 2.4, highlight: null }, "2 h")).toBe(
      "Moda · 2,4 km · 2 h",
    );
    expect(storyMeta({ typeLabel: "Moda", distanceKm: 2.4, highlight: { name: "Verão" } }, null)).toBe(
      "Destaque · Verão",
    );
  });
});

describe("live", () => {
  it("formata o tempo", () => {
    expect(formatElapsed(65)).toBe("01:05");
    expect(formatElapsed(3600 + 61)).toBe("1:01:01");
    expect(formatElapsed(-4)).toBe("00:00");
  });
  it("mantém as 40 últimas sem repetir", () => {
    const a = Array.from({ length: 40 }, (_, i) => ({ id: String(i) }));
    const r = mergeMessages(a, [{ id: "39" }, { id: "40" }]);
    expect(r).toHaveLength(40);
    expect(r[0].id).toBe("1");
    expect(r.at(-1)?.id).toBe("40");
  });
});

describe("evento", () => {
  const now = new Date(2026, 9, 12, 12, 0);
  const at = (d: number, h: number) => new Date(2026, 9, 12 + d, h, 0).toISOString();
  it("situação", () => {
    expect(eventWhen(at(0, 11), at(0, 14), now).label).toBe("Acontecendo agora");
    expect(eventWhen(at(0, 8), at(0, 10), now).label).toBe("Encerrado hoje");
    expect(eventWhen(at(-2, 8), at(-2, 10), now).label).toBe("Já aconteceu");
    expect(eventWhen(at(0, 20), null, now).label).toBe("Hoje");
    expect(eventWhen(at(1, 20), null, now).label).toBe("É amanhã");
    expect(eventWhen(at(5, 20), null, now).label).toBe("Faltam 5 dias");
  });
  it("selo do dia vem da data", () => {
    expect(eventDayBadge(at(0, 20), now)).toBe("Hoje");
    expect(eventDayBadge(at(3, 20), now)).toBe("Quinta-feira");
  });
});

import { activeStoryGroups, findStoryPos } from "./discover";
import type { StoryGroup } from "@/lib/api/discover";

describe("stories de 24 h", () => {
  const now = Date.parse("2026-10-13T12:00:00Z");
  const story = (id: string, at: string) =>
    ({ id, publishedAt: at }) as unknown as StoryGroup["stories"][number];
  const group = (stories: StoryGroup["stories"], highlight: StoryGroup["highlight"] = null) =>
    ({ profile: { id: "p" }, highlight, stories }) as unknown as StoryGroup;
  it("tira o que passou de 24 h e o grupo vazio", () => {
    const g = activeStoryGroups(
      [
        group([story("a", "2026-10-13T00:00:00Z"), story("b", "2026-10-12T11:00:00Z")]),
        group([story("c", "2026-10-11T00:00:00Z")]),
      ],
      now,
    );
    expect(g).toHaveLength(1);
    expect(g[0].stories.map((s) => s.id)).toEqual(["a"]);
  });
  it("destaque é permanente", () => {
    const g = activeStoryGroups(
      [group([story("old", "2026-01-01T00:00:00Z")], { id: "h", name: "Verão" })],
      now,
    );
    expect(g).toHaveLength(1);
  });
  it("data inválida é mantida", () => {
    expect(activeStoryGroups([group([story("x", "lixo")])], now)).toHaveLength(1);
  });
});

describe("achar story na fila", () => {
  const st = (id: string) => ({ id }) as unknown as StoryGroup["stories"][number];
  const groups = [
    { profile: { id: "p1" }, stories: [st("a"), st("b")] },
    { profile: { id: "p2" }, stories: [st("c")] },
  ] as unknown as StoryGroup[];
  it("devolve grupo e posição", () => {
    expect(findStoryPos(groups, "b")).toEqual({ g: 0, s: 1 });
    expect(findStoryPos(groups, "c")).toEqual({ g: 1, s: 0 });
  });
  it("story que saiu da fila: null", () => {
    expect(findStoryPos(groups, "zzz")).toBeNull();
  });
});
