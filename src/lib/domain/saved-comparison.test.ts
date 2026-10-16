import { describe, expect, it } from "vitest";

import { defaultComparisonName, savedToEntries } from "./saved-comparison";

describe("comparação salva", () => {
  it("nome automático", () => {
    expect(defaultComparisonName(["Tênis X", "Tênis Y"], "Tênis")).toBe("Tênis X × Tênis Y");
    expect(defaultComparisonName([], "Tênis")).toBe("Comparação de Tênis");
    expect(defaultComparisonName(["a".repeat(50), "b".repeat(50)], "x").length).toBe(60);
  });
  it("volta para a seleção com grupo e origem", () => {
    const e = savedToEntries({
      id: "c1",
      name: "n",
      createdAt: "2026-10-13T10:00:00Z",
      group: { id: "g", label: "Tênis" },
      items: [
        { ref: "product:1", title: "A", imageUrl: null },
        { ref: "product:2", title: "B", imageUrl: null },
      ],
    });
    expect(e).toEqual([
      { ref: "product:1", group: { id: "g", label: "Tênis" }, origin: "conta", title: "A", imageUrl: null },
      { ref: "product:2", group: { id: "g", label: "Tênis" }, origin: "conta", title: "B", imageUrl: null },
    ]);
  });
});
