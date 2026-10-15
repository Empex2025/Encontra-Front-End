import { describe, expect, it } from "vitest";

import { canSend, clipMessage, listTimeLabel, previewText, validateChatImage, validateReport } from "./chat";

describe("listTimeLabel", () => {
  const now = new Date("2026-10-15T15:00:00Z"); // quinta, 12:00 em Maceió
  it("hoje mostra a hora", () => expect(listTimeLabel("2026-10-15T13:16:00Z", now)).toBe("10:16"));
  it("ontem", () => expect(listTimeLabel("2026-10-14T15:00:00Z", now)).toBe("ontem"));
  it("virada do dia usa o fuso de Maceió", () => {
    // 01:30Z de hoje ainda é a noite de ontem em Maceió (22:30)
    expect(listTimeLabel("2026-10-15T01:30:00Z", now)).toBe("ontem");
  });
  it("até 6 dias mostra o dia da semana, sem ponto", () =>
    expect(listTimeLabel("2026-10-12T15:00:00Z", now)).toBe("seg"));
  it("mais antigo mostra dia/mês", () => expect(listTimeLabel("2026-09-28T15:00:00Z", now)).toBe("28/09"));
  it("data inválida vira vazio", () => expect(listTimeLabel("x", now)).toBe(""));
});

describe("validateChatImage", () => {
  it("aceita jpg/png/webp até 5 MB", () => {
    expect(validateChatImage({ type: "image/png", size: 1000 })).toBeNull();
    expect(validateChatImage({ type: "image/webp", size: 5 * 1024 * 1024 })).toBeNull();
  });
  it("recusa outros tipos", () =>
    expect(validateChatImage({ type: "application/pdf", size: 10 })).toMatch(/não é uma foto/));
  it("recusa acima de 5 MB e informa o tamanho", () => {
    expect(validateChatImage({ type: "image/jpeg", size: 6.4 * 1024 * 1024 })).toBe(
      "A foto tem 6,4 MB e o limite é 5 MB. Escolha uma imagem menor.",
    );
  });
});

describe("mensagem", () => {
  it("corta em 500", () => expect(clipMessage("a".repeat(600))).toHaveLength(500));
  it("não envia vazio sem foto", () => {
    expect(canSend("   ", false)).toBe(false);
    expect(canSend("", true)).toBe(true);
    expect(canSend("oi", false)).toBe(true);
  });
});

describe("previewText", () => {
  const base = { blocked: false };
  it("cobre os casos do documento", () => {
    expect(previewText({ ...base, last: null })).toBe("Nenhuma mensagem ainda");
    expect(previewText({ blocked: true, last: null })).toBe("Você bloqueou esta loja");
    expect(previewText({ ...base, last: { text: null, hasImage: true, mine: false } })).toBe("📷 Foto");
    expect(previewText({ ...base, last: { text: "olha", hasImage: true, mine: true } })).toBe(
      "Você: 📷 olha",
    );
    expect(previewText({ ...base, last: { text: "oi", hasImage: false, mine: true } })).toBe("Você: oi");
  });
});

describe("validateReport", () => {
  it("exige motivo", () => expect(validateReport(null, "").reason).toBeTruthy());
  it("Outro exige relato", () => {
    expect(validateReport("other", " ").details).toBeTruthy();
    expect(validateReport("other", "foi golpe")).toEqual({});
  });
  it("limita a 400", () => expect(validateReport("spam", "x".repeat(401)).details).toBeTruthy());
});
