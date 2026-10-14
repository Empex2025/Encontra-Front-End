import { describe, expect, it } from "vitest";

import { belowCents, validateAlert, type AlertDraft } from "./alert-form";

const base: AlertDraft = {
  conditions: ["restock"],
  belowReais: "",
  size: null,
  radiusKm: 10,
  channels: ["site"],
};

describe("validateAlert", () => {
  it("exige pelo menos uma condição", () => {
    expect(validateAlert({ ...base, conditions: [] })).toMatch(/pelo menos uma opção/);
  });
  it("exige um canal", () => {
    expect(validateAlert({ ...base, channels: [] })).toMatch(/por onde/);
  });
  it("aceita o formulário completo", () => {
    expect(validateAlert(base)).toBeNull();
  });
});

describe("belowCents", () => {
  it("só vale com 'preço baixar'", () => {
    expect(belowCents({ conditions: ["restock"], belowReais: "200" })).toBeUndefined();
    expect(belowCents({ conditions: ["price_drop"], belowReais: "200" })).toBe(20000);
  });
  it("ignora vazio, zero e letras; limita a 5 dígitos", () => {
    expect(belowCents({ conditions: ["price_drop"], belowReais: "" })).toBeUndefined();
    expect(belowCents({ conditions: ["price_drop"], belowReais: "0" })).toBeUndefined();
    expect(belowCents({ conditions: ["price_drop"], belowReais: "1a2b" })).toBe(1200);
    expect(belowCents({ conditions: ["price_drop"], belowReais: "1234567" })).toBe(1234500);
  });
});
