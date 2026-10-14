import { describe, expect, it } from "vitest";

import { sectionState } from "./section-state";

describe("sectionState", () => {
  it("sem local definido a consulta fica parada", () => {
    expect(sectionState({ isPending: true, isError: false }, false, 0)).toBe("idle");
  });
  it("erro nunca vira vazio", () => {
    expect(sectionState({ isPending: false, isError: true }, true, 0)).toBe("error");
  });
  it("carregando, vazio e pronto são diferentes", () => {
    expect(sectionState({ isPending: true, isError: false }, true, 0)).toBe("loading");
    expect(sectionState({ isPending: false, isError: false }, true, 0)).toBe("empty");
    expect(sectionState({ isPending: false, isError: false }, true, 2)).toBe("ready");
  });
});
