import { describe, expect, it } from "vitest";

import { productMessage, whatsappUrl } from "./whatsapp";

const nbsp = (s: string) => s.replace(/ /g, " ");

describe("productMessage", () => {
  it("1 unidade, sem tamanho: singular e sem 'cada'", () => {
    const m = nbsp(productMessage({ store: "Loja A", title: "Tênis X", quantity: 1, priceCents: 27990 }));
    expect(m).toBe(
      "Olá, Loja A! Vi no EncontraÊ e tenho interesse no Tênis X, 1 unidade (R$ 279,90). Ainda está disponível?",
    );
  });
  it("várias unidades com tamanho: plural e 'cada'", () => {
    const m = nbsp(
      productMessage({ store: "Loja A", title: "Tênis X", size: "42", quantity: 3, priceCents: 27990 }),
    );
    expect(m).toContain("Tênis X, tamanho 42, 3 unidades (R$ 279,90 cada)");
  });
  it("sem preço informado, não escreve preço", () => {
    const m = productMessage({ store: "Loja A", title: "Tênis X", quantity: 1, priceCents: null });
    expect(m).toContain("1 unidade. Ainda");
  });
});

describe("whatsappUrl", () => {
  it("monta o link com o texto codificado", () => {
    expect(whatsappUrl("5582999998888", "Olá!")).toBe("https://wa.me/5582999998888?text=Ol%C3%A1!");
  });
  it("aceita máscara, recusa número curto ou ausente", () => {
    expect(whatsappUrl("+55 (82) 99999-8888", "x")).toContain("wa.me/5582999998888");
    expect(whatsappUrl("123", "x")).toBeNull();
    expect(whatsappUrl(null, "x")).toBeNull();
  });
});
