import { describe, expect, it } from "vitest";

import { countWithCoords, resultsHeading } from "./explorar-copy";

describe("resultsHeading", () => {
  it("carregando não mostra número", () => {
    expect(resultsHeading({ q: "tênis", status: "loading", total: 0 })).toBe("Buscando “tênis”…");
    expect(resultsHeading({ q: "", status: "loading", total: 0 })).toBe("Carregando…");
  });
  it("sem local não diz “0 resultados” nem “carregando”", () => {
    expect(resultsHeading({ q: "tênis", status: "no-place", total: 0 })).toBe("Busca por “tênis”");
    expect(resultsHeading({ q: "", status: "no-place", total: 0 })).toBe("O que tem perto de você");
  });
  it("erro nunca vira “0 resultados”", () => {
    const t = resultsHeading({ q: "tênis", status: "error", total: 0 });
    expect(t).toBe("Não foi possível buscar “tênis”");
    expect(t).not.toMatch(/\b0\b/);
    expect(resultsHeading({ q: "", status: "error", total: 0 })).toBe("Não foi possível carregar");
  });
  it("zero só aparece quando o servidor respondeu", () => {
    expect(resultsHeading({ q: "tênis", status: "ready", total: 0 })).toBe("0 resultados para “tênis”");
    expect(resultsHeading({ q: "tênis", status: "ready", total: 1 })).toBe("1 resultado para “tênis”");
  });
  it("inclui lente e categoria", () => {
    expect(resultsHeading({ q: "tênis", cat: "esporte", lens: "offers", status: "ready", total: 5 })).toBe(
      "5 resultados em oferta para “tênis” em Esporte",
    );
  });
  it("descoberta sem termo", () => {
    expect(resultsHeading({ q: "", status: "ready", total: 3 })).toBe("O que tem perto de você");
    expect(resultsHeading({ q: "", cat: "pet", status: "ready", total: 3 })).toBe("Pet perto de você");
    expect(resultsHeading({ q: "", lens: "live", status: "ready", total: 3 })).toBe("Ao vivo perto de você");
    expect(resultsHeading({ q: "", cat: "pet", lens: "live", status: "ready", total: 3 })).toBe(
      "Pet · ao vivo perto de você",
    );
  });
});

describe("countWithCoords", () => {
  it("conta só quem tem latitude e longitude", () => {
    expect(
      countWithCoords([
        { lat: -8.05, lng: -34.9 },
        { lat: null, lng: null },
        { lat: -8.1, lng: null },
      ]),
    ).toBe(1);
    expect(countWithCoords([])).toBe(0);
  });
});
