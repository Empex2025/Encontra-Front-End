import { describe, expect, it } from "vitest";

import { servicePrice } from "./service-price";

describe("servicePrice", () => {
  it("sem tipo: usa o campo antigo fromCents ou cai em orçamento", () => {
    expect(servicePrice({ fromCents: 8000 })).toMatchObject({ prefix: "a partir de", action: "Solicitar serviço" });
    expect(servicePrice({ fromCents: null })).toMatchObject({ value: "Sob orçamento", action: "Pedir orçamento" });
  });
  it("por hora, unidade e período, com mínimo", () => {
    expect(servicePrice({ priceType: "hour", priceCents: 6000 }).suffix).toBe("por hora");
    expect(servicePrice({ priceType: "unit", priceCents: 2500, unitLabel: "ponto", minCents: 5000 }).suffix).toMatch(/^por ponto · mín\./);
    expect(servicePrice({ priceType: "period", priceCents: 30000 }).suffix).toBe("por dia");
  });
  it("grátis e a combinar não mostram valor e mudam o botão", () => {
    expect(servicePrice({ priceType: "free" })).toMatchObject({ value: "Grátis", action: "Solicitar serviço" });
    expect(servicePrice({ priceType: "combine" })).toMatchObject({ value: "A combinar", action: "Combinar pelo chat" });
  });
  it("tipo com valor mas sem centavos vira orçamento", () => {
    expect(servicePrice({ priceType: "hour", priceCents: null }).value).toBe("Sob orçamento");
  });
});
