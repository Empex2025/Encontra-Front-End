import { describe, expect, it } from "vitest";

import { listCompareEntries } from "./list-compare";

const it_ = (id: string, g?: string) => ({
  id,
  type: "product" as const,
  group: g ? { id: g, label: g } : null,
});

describe("listCompareEntries", () => {
  it("pega o grupo mais frequente, até 3", () => {
    const r = listCompareEntries(
      [it_("1", "a"), it_("2", "b"), it_("3", "b"), it_("4", "b"), it_("5", "b")],
      "lista",
    );
    expect(r.map((e) => e.ref)).toEqual(["product:2", "product:3", "product:4"]);
    expect(r[0].origin).toBe("lista");
  });
  it("sem 2 do mesmo grupo, não oferece", () => {
    expect(listCompareEntries([it_("1", "a"), it_("2", "b"), it_("3")], "x")).toEqual([]);
  });
  it("ignora lugares", () => {
    expect(
      listCompareEntries([{ id: "1", type: "place", group: { id: "a", label: "a" } }, it_("2", "a")], "x"),
    ).toEqual([]);
  });
});
