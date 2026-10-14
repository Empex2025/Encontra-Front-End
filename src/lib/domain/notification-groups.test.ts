import { describe, expect, it } from "vitest";

import { groupNotifications, groupOf, safeInternalHref } from "./notification-groups";

const now = new Date("2026-10-12T15:00:00Z"); // 12:00 em Maceió

describe("groupOf", () => {
  it("separa agora, hoje, ontem, semana e antigas", () => {
    expect(groupOf("2026-10-12T14:30:00Z", now)).toBe("now");
    expect(groupOf("2026-10-12T10:00:00Z", now)).toBe("today");
    expect(groupOf("2026-10-11T20:00:00Z", now)).toBe("yesterday");
    expect(groupOf("2026-10-07T12:00:00Z", now)).toBe("week");
    expect(groupOf("2026-09-20T12:00:00Z", now)).toBe("older");
  });
  it("usa o dia civil de Maceió, não UTC", () => {
    // 01:00 UTC de 12/10 ainda é 22:00 de 11/10 em Maceió → ontem
    expect(groupOf("2026-10-12T01:00:00Z", now)).toBe("yesterday");
  });
  it("data inválida → null", () => expect(groupOf("x", now)).toBeNull());
});

describe("groupNotifications", () => {
  it("ordena grupos e itens, do mais novo ao mais antigo", () => {
    const g = groupNotifications(
      [
        { createdAt: "2026-10-11T20:00:00Z" },
        { createdAt: "2026-10-12T14:30:00Z" },
        { createdAt: "2026-10-12T09:00:00Z" },
        { createdAt: "2026-10-12T10:00:00Z" },
      ],
      now,
    );
    expect(g.map((x) => x.id)).toEqual(["now", "today", "yesterday"]);
    expect(g[1].items.map((i) => i.createdAt)).toEqual(["2026-10-12T10:00:00Z", "2026-10-12T09:00:00Z"]);
  });
});

describe("safeInternalHref", () => {
  it("aceita só caminho interno", () => {
    expect(safeInternalHref("/p/tenis")).toBe("/p/tenis");
    expect(safeInternalHref("/atividade?aba=cupons")).toBe("/atividade?aba=cupons");
    expect(safeInternalHref("//evil.com")).toBeNull();
    expect(safeInternalHref("https://evil.com")).toBeNull();
    expect(safeInternalHref("javascript:alert(1)")).toBeNull();
    expect(safeInternalHref("/\\evil")).toBeNull();
    expect(safeInternalHref(null)).toBeNull();
  });
});
