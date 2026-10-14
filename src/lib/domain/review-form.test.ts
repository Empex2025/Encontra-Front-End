import { describe, expect, it } from "vitest";

import { displayName, highlightsFor, nextHighlights, validatePhoto, validateReview, validateVideo } from "./review-form";

describe("validateReview", () => {
  it("exige nota e 2 fotos", () => {
    const e = validateReview({ rating: 0, photos: 1, uploading: false });
    expect(e.rating).toBe("Escolha uma nota de 1 a 5 estrelas.");
    expect(e.photos).toBe("Adicione pelo menos 2 fotos (faltam 1).");
    expect(validateReview({ rating: 4, photos: 2, uploading: false })).toEqual({});
  });
});

describe("destaques", () => {
  it("negativos para 1–2, positivos para o resto", () => {
    expect(highlightsFor(2)).toContain("Preço alto");
    expect(highlightsFor(0)).toContain("Recomendo");
    expect(highlightsFor(5)).toContain("Boa qualidade");
  });
  it("cruzar a fronteira limpa; no mesmo lado mantém", () => {
    expect(nextHighlights(["Preço alto"], 2, 4)).toEqual([]);
    expect(nextHighlights(["Recomendo"], 4, 5)).toEqual(["Recomendo"]);
    expect(nextHighlights(["Recomendo"], 0, 3)).toEqual(["Recomendo"]);
    expect(nextHighlights(["Recomendo"], 3, 1)).toEqual([]);
  });
});

describe("mídia", () => {
  it("foto: JPG/PNG", () => {
    expect(validatePhoto({ type: "image/png", size: 10 })).toBeNull();
    expect(validatePhoto({ type: "image/gif", size: 10 })).toBeTruthy();
  });
  it("vídeo: MP4 até 60 s", () => {
    expect(validateVideo({ type: "video/mp4", size: 10 }, 60)).toBeNull();
    expect(validateVideo({ type: "video/mp4", size: 10 }, 61)).toMatch(/60 segundos/);
    expect(validateVideo({ type: "video/mp4", size: 10 }, null)).toBeTruthy();
    expect(validateVideo({ type: "video/webm", size: 10 }, 5)).toBeTruthy();
  });
});

describe("displayName", () => {
  it("primeiro nome + inicial", () => {
    expect(displayName("kaio mendes", true)).toBe("kaio M.");
    expect(displayName("Maria da Silva", true)).toBe("Maria S.");
    expect(displayName("Ana", true)).toBe("Ana");
    expect(displayName("Ana Lima", false)).toBe("Cliente anônimo");
    expect(displayName(null, true)).toBe("Cliente anônimo");
  });
});
