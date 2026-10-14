import { describe, expect, it } from "vitest";

import { matches, normalize } from "./text-match";

describe("busca local", () => {
  it("ignora acento e maiúsculas", () => {
    expect(normalize("Calçados São João")).toBe("calcados sao joao");
    expect(matches("sao joao", "Calçados São João")).toBe(true);
  });
  it("busca vazia aceita tudo", () => {
    expect(matches("  ", "qualquer")).toBe(true);
    expect(matches("", null)).toBe(true);
  });
  it("procura em qualquer campo e ignora campos vazios", () => {
    expect(matches("tenis", null, "Tênis de corrida")).toBe(true);
    expect(matches("bota", undefined, "Tênis")).toBe(false);
  });
});
