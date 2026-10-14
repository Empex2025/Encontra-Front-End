import { beforeEach, describe, expect, it, vi } from "vitest";

import { peekTextDraft, saveTextDraft, takeTextDraft, textDraftKey } from "./text-draft";

describe("rascunho de texto", () => {
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
    saveTextDraft("live:1", "que lindo!");
    expect(peekTextDraft("live:1")).toBe("que lindo!");
    expect(takeTextDraft("live:1", 200)).toBe("que lindo!");
    expect(takeTextDraft("live:1", 200)).toBeNull();
  });
  it("corta no limite e ignora texto vazio", () => {
    saveTextDraft("s", "abcdef");
    expect(takeTextDraft("s", 3)).toBe("abc");
    saveTextDraft("s", "   ");
    expect(takeTextDraft("s", 10)).toBeNull();
  });
  it("cada escopo tem a sua chave", () => {
    expect(textDraftKey("a")).not.toBe(textDraftKey("b"));
  });
  it("sem sessionStorage não quebra", () => {
    vi.stubGlobal("window", {});
    expect(() => saveTextDraft("x", "y")).not.toThrow();
    expect(takeTextDraft("x", 5)).toBeNull();
  });
});
