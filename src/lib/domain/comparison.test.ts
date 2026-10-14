import { describe, expect, it } from "vitest";

import type { ComparedItem, Criterion } from "@/lib/api/comparison";

import {
  buttonState,
  computeWinners,
  type CompareEntry,
  isEqualRow,
  orderCriteria,
  toggleEntry,
  togglePriority,
} from "./comparison";

const g = { id: "tenis", label: "Tênis" };
const e = (ref: string, group = g): CompareEntry => ({ ref, group, origin: "pesquisa" });

const price: Criterion = {
  id: "price",
  label: "Preço",
  kind: "money",
  better: "lower",
  priority: { badge: "Menor preço" },
};
const rating: Criterion = {
  id: "rating",
  label: "Avaliação",
  kind: "rating",
  better: "higher",
  priority: { badge: "Melhor avaliação" },
};
const store: Criterion = { id: "store", label: "Loja", kind: "text", better: null, priority: null };
const item = (ref: string, p: number | null, r: number | null, s = "Loja"): ComparedItem => ({
  ref,
  type: "product",
  id: ref,
  slug: ref,
  title: ref,
  imageUrl: null,
  profile: null,
  cells: {
    price: { text: p === null ? null : String(p), detail: null, value: p },
    rating: { text: r === null ? null : String(r), detail: null, value: r },
    store: { text: s, detail: null, value: null },
  },
});

describe("toggleEntry", () => {
  it("adiciona, remove e respeita o limite de 3", () => {
    let list: CompareEntry[] = [];
    list = toggleEntry(list, e("a")).list;
    list = toggleEntry(list, e("b")).list;
    list = toggleEntry(list, e("c")).list;
    expect(list).toHaveLength(3);
    expect(toggleEntry(list, e("d")).result).toBe("full");
    const removed = toggleEntry(list, e("b"));
    expect(removed.result).toBe("removed");
    expect(removed.list.map((x) => x.ref)).toEqual(["a", "c"]);
  });
  it("o primeiro item trava o grupo", () => {
    const list = toggleEntry([], e("a")).list;
    const r = toggleEntry(list, e("x", { id: "relogio", label: "Relógio" }));
    expect(r.result).toBe("other_group");
    expect(r.list).toHaveLength(1);
  });
});

describe("buttonState", () => {
  it("reflete o estado sem tentar adicionar", () => {
    const list = [e("a"), e("b"), e("c")];
    expect(buttonState(list, "a", "tenis")).toBe("in");
    expect(buttonState(list, "d", "tenis")).toBe("full");
    expect(buttonState(list, "d", "relogio")).toBe("other_group");
    expect(buttonState([], "d", "tenis")).toBe("can_add");
  });
});

describe("computeWinners", () => {
  const items = [item("a", 300, 4.5), item("b", 250, 4.9), item("c", 250, 4.1)];
  it("ganha o menor preço, com empate para todos", () => {
    expect(computeWinners([price, rating], items, ["price"])).toEqual({ price: ["b", "c"] });
  });
  it("só destaca o que foi marcado", () => {
    expect(computeWinners([price, rating], items, [])).toEqual({});
  });
  it("não destaca quando os valores são iguais ou faltam", () => {
    expect(computeWinners([price], [item("a", 100, null), item("b", 100, null)], ["price"])).toEqual({});
    expect(computeWinners([price], [item("a", 100, null), item("b", null, null)], ["price"])).toEqual({});
  });
  it("ignora critério sem prioridade", () => {
    expect(computeWinners([store], items, ["store"])).toEqual({});
  });
  it("maior nota vence em 'higher'", () => {
    expect(computeWinners([rating], items, ["rating"])).toEqual({ rating: ["b"] });
  });
});

describe("linhas", () => {
  it("detecta linha igual", () => {
    expect(isEqualRow(store, [item("a", 1, 1), item("b", 2, 2)])).toBe(true);
    expect(isEqualRow(store, [item("a", 1, 1, "X"), item("b", 2, 2, "Y")])).toBe(false);
  });
  it("prioridades sobem ao topo na ordem marcada", () => {
    expect(orderCriteria([price, rating, store], ["rating", "price"]).map((c) => c.id)).toEqual([
      "rating",
      "price",
      "store",
    ]);
  });
  it("máximo de 3 prioridades", () => {
    expect(togglePriority(["a", "b", "c"], "d")).toEqual({ list: ["a", "b", "c"], limitReached: true });
    expect(togglePriority(["a", "b"], "b").list).toEqual(["a"]);
  });
});
