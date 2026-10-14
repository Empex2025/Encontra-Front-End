import { describe, expect, it } from "vitest";

import {
  filterRadar,
  growthText,
  priceChangeText,
  radarHeadline,
  radarTabs,
  safeInternalHref,
  trackingLine,
  visibleRadarItems,
} from "./radar";

const item = (id: string, kind: string) => ({ id, kind, title: id, at: "2026-10-12T10:00:00Z", seen: false });

describe("radar", () => {
  it("manchete", () => {
    expect(radarHeadline(0)).toBe("Você está em dia");
    expect(radarHeadline(1)).toBe("Seu radar encontrou 1 novidade");
    expect(radarHeadline(3)).toBe("Seu radar encontrou 3 novidades");
  });
  it("visitante só vê novidades e preços", () => {
    expect(radarTabs(true)).toEqual(["all", "new", "price"]);
    const items = [item("a", "new"), item("b", "follow"), item("c", "price"), item("d", "xyz")];
    expect(visibleRadarItems(items, true).map((i) => i.id)).toEqual(["a", "c"]);
    expect(visibleRadarItems(items, false).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
  it("limita a 8 e filtra por aba", () => {
    const many = Array.from({ length: 12 }, (_, i) => item(String(i), "new"));
    expect(visibleRadarItems(many, false)).toHaveLength(8);
    expect(filterRadar([item("a", "new"), item("b", "price")], "price").map((i) => i.id)).toEqual(["b"]);
  });
  it("linha Acompanha omite o que é zero", () => {
    expect(trackingLine({ follows: 1, alerts: 0, interests: [] })).toBe("Acompanha: 1 loja que você segue");
    expect(trackingLine({ follows: 4, alerts: 2, interests: ["Moda", "Casa"] })).toBe(
      "Acompanha: 4 lojas que você segue · 2 alertas · interesses: Moda, Casa",
    );
    expect(trackingLine({ follows: 0, alerts: 0, interests: [] })).toBeNull();
  });
  it("só aceita destino interno", () => {
    expect(safeInternalHref("/p/x")).toBe("/p/x");
    expect(safeInternalHref("//evil.com")).toBeNull();
    expect(safeInternalHref("https://evil.com")).toBeNull();
    expect(safeInternalHref("/\\evil")).toBeNull();
    expect(safeInternalHref(null)).toBeNull();
  });
  it("variação de preço e crescimento", () => {
    const base = { item: "x", valueCents: 100, basis: "b", direction: "down" as const };
    expect(priceChangeText({ ...base, changePct: -2.1, period: "7 dias" })).toBe("▼ 2,1% em 7 dias");
    expect(priceChangeText({ ...base, direction: "flat", changePct: 0 })).toBeNull();
    expect(growthText(34.6)).toBe("+35%");
    expect(growthText(0)).toBeNull();
  });
});
