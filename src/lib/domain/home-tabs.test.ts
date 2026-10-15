import { describe, expect, it } from "vitest";

import { HOME_TABS } from "@/lib/api/home";

import { pageRange, seeAllHref } from "./home-tabs";

describe("pageRange", () => {
  it("primeira página de 12: 1–6, só avança", () => {
    expect(pageRange(1, 6, 6, 12)).toEqual({ first: 1, last: 6, hasPrev: false, hasNext: true });
  });
  it("última página parcial: 11–12 e só volta", () => {
    expect(pageRange(3, 5, 2, 12)).toEqual({ first: 11, last: 12, hasPrev: true, hasNext: false });
  });
  it("total exato na página cheia não oferece próxima", () => {
    expect(pageRange(2, 5, 5, 10).hasNext).toBe(false);
  });
});

describe("seeAllHref", () => {
  it("Acontecendo: cada aba leva à lente certa", () => {
    expect(seeAllHref("happening", "live")).toContain("lente=live");
    expect(seeAllHref("happening", "price")).toContain("lente=price");
    expect(seeAllHref("happening", "all")).toContain("lente=offers");
  });
  it("Produtos: a aba é a categoria; Tudo não filtra", () => {
    expect(seeAllHref("products", "moda")).toContain("cat=moda");
    expect(seeAllHref("products", "all")).toBe("/explorar");
  });
  it("Serviços e Experiências usam categoria e lente de aberto", () => {
    expect(seeAllHref("services", "today")).toContain("lente=open");
    expect(seeAllHref("services", "beleza")).toContain("cat=beleza");
    expect(seeAllHref("experiences", "comer")).toContain("cat=comida");
    expect(seeAllHref("experiences", "open")).toContain("lente=open");
  });
});

describe("HOME_TABS", () => {
  it("toda seção começa em Tudo e não repete aba", () => {
    for (const tabs of Object.values(HOME_TABS)) {
      expect(tabs[0].id).toBe("all");
      expect(new Set(tabs.map((t) => t.id)).size).toBe(tabs.length);
    }
  });
});
