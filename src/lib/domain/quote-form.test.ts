import { describe, expect, it } from "vitest";

import { validateQuote } from "./quote-form";

const ok = { serviceId: "s1", when: "today", neighborhood: "", details: "", needsNeighborhood: false };

describe("validateQuote", () => {
  it("aceita o mínimo", () => expect(validateQuote(ok)).toEqual({}));
  it("exige serviço e prazo", () => {
    const e = validateQuote({ ...ok, serviceId: null, when: "" });
    expect(Object.keys(e)).toEqual(["serviceId", "when"]);
  });
  it("exige bairro só no atendimento em domicílio", () => {
    expect(validateQuote({ ...ok, needsNeighborhood: true }).neighborhood).toBeTruthy();
    expect(validateQuote({ ...ok, needsNeighborhood: true, neighborhood: "Ponta Verde" })).toEqual({});
  });
  it("limita os detalhes a 400", () => {
    expect(validateQuote({ ...ok, details: "x".repeat(401) }).details).toBeTruthy();
  });
});
