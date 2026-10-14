import { describe, expect, it } from "vitest";

import { registerStepHref, resolveRegisterStep } from "./register-steps";

const out = { hasChallenge: false, signedIn: false };

describe("resolveRegisterStep", () => {
  it("sem etapa ou etapa desconhecida: dados", () => {
    expect(resolveRegisterStep(null, out)).toBe("dados");
    expect(resolveRegisterStep("xyz", out)).toBe("dados");
  });
  it("código só com o desafio na memória", () => {
    expect(resolveRegisterStep("codigo", out)).toBe("dados");
    expect(resolveRegisterStep("codigo", { hasChallenge: true, signedIn: false })).toBe("codigo");
  });
  it("depois da conta criada, voltar ao código leva à localização", () => {
    expect(resolveRegisterStep("codigo", { hasChallenge: true, signedIn: true })).toBe("local");
  });
  it("localização, interesses e pronto exigem conta", () => {
    for (const s of ["local", "interesses", "pronto"]) {
      expect(resolveRegisterStep(s, out)).toBe("dados");
      expect(resolveRegisterStep(s, { hasChallenge: false, signedIn: true })).toBe(s);
    }
  });
});

describe("registerStepHref", () => {
  it("dados é a rota limpa", () => {
    expect(registerStepHref("dados")).toBe("/cadastro");
    expect(registerStepHref("local")).toBe("/cadastro?etapa=local");
  });
});
