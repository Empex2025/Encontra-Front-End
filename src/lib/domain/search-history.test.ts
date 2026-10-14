import { describe, expect, it } from "vitest";

import { HISTORY_MAX, mergeHistory } from "./search-history";

describe("mergeHistory", () => {
  it("coloca o termo novo primeiro", () => {
    expect(mergeHistory(["pizza"], "tênis")).toEqual(["tênis", "pizza"]);
  });
  it("não repete ignorando acento e maiúscula, e mantém a grafia mais recente", () => {
    expect(mergeHistory(["Farmácia 24h", "pizza"], "farmacia 24H")).toEqual(["farmacia 24H", "pizza"]);
  });
  it("ignora termo vazio", () => {
    expect(mergeHistory(["pizza"], "   ")).toEqual(["pizza"]);
  });
  it("guarda no máximo 8 termos", () => {
    const base = Array.from({ length: 8 }, (_, i) => `t${i}`);
    const out = mergeHistory(base, "novo");
    expect(out).toHaveLength(HISTORY_MAX);
    expect(out[0]).toBe("novo");
    expect(out).not.toContain("t7");
  });
});
