import { describe, expect, it } from "vitest";

import { formatCount, formatTimeAgo } from "./format";

describe("formatCount", () => {
  it("abaixo de mil mostra o número", () => expect(formatCount(998)).toBe("998"));
  it("acima de mil usa 'mil' com vírgula", () => {
    expect(formatCount(12400)).toBe("12,4 mil");
    expect(formatCount(1000)).toBe("1 mil");
  });
});

describe("formatTimeAgo", () => {
  const now = new Date("2026-10-12T12:00:00Z");
  it("minutos, horas, dias, meses", () => {
    expect(formatTimeAgo("2026-10-12T11:30:00Z", now)).toBe("há 30 min");
    expect(formatTimeAgo("2026-10-12T09:00:00Z", now)).toBe("há 3 h");
    expect(formatTimeAgo("2026-10-11T12:00:00Z", now)).toBe("há 1 dia");
    expect(formatTimeAgo("2026-07-12T12:00:00Z", now)).toBe("há 3 meses");
  });
  it("data inválida não inventa texto", () => expect(formatTimeAgo("lixo", now)).toBeNull());
});
