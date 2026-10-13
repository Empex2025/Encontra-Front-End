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

import { quoteDraftKey, saveQuoteDraft, takeQuoteDraft } from "./quote-form";
import { beforeEach, vi } from "vitest";

describe("rascunho do pedido", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
  });
  it("volta uma vez e some", () => {
    saveQuoteDraft("p1", {
      serviceId: "s1",
      when: "today",
      neighborhood: "Farol",
      details: "troca de chuveiro",
    });
    expect(takeQuoteDraft("p1")).toEqual({
      serviceId: "s1",
      when: "today",
      neighborhood: "Farol",
      details: "troca de chuveiro",
    });
    expect(takeQuoteDraft("p1")).toBeNull();
  });
  it("ignora lixo e prazo inválido", () => {
    window.sessionStorage.setItem(
      quoteDraftKey("p2"),
      JSON.stringify({ serviceId: 5, when: "xx", details: "a".repeat(999) }),
    );
    const d = takeQuoteDraft("p2");
    expect(d?.serviceId).toBeNull();
    expect(d?.when).toBe("");
    expect(d?.details.length).toBe(400);
  });
});
