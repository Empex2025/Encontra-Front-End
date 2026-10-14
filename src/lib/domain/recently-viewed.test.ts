import { describe, expect, it } from "vitest";

import { mergeViewed, VIEWED_MAX, type ViewedRef } from "./recently-viewed";

describe("mergeViewed", () => {
  it("põe o mais novo primeiro e não repete", () => {
    const a: ViewedRef = { type: "product", slug: "a" };
    const b: ViewedRef = { type: "product", slug: "b" };
    expect(mergeViewed([a, b], b)).toEqual([b, a]);
  });
  it("mesmo slug de tipos diferentes são itens diferentes", () => {
    const out = mergeViewed([{ type: "store", slug: "x" }], { type: "product", slug: "x" });
    expect(out).toHaveLength(2);
  });
  it("guarda no máximo 20", () => {
    const list = Array.from({ length: VIEWED_MAX }, (_, i) => ({ type: "product" as const, slug: `p${i}` }));
    const out = mergeViewed(list, { type: "product", slug: "novo" });
    expect(out).toHaveLength(VIEWED_MAX);
    expect(out[0].slug).toBe("novo");
  });
});
