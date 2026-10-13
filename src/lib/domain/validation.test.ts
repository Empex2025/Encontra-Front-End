import { describe, expect, it } from "vitest";

import {
  firstName,
  formatClock,
  isLoginIdentifier,
  isValidCpf,
  isValidPassword,
  maskCep,
  maskCpf,
  maskPhone,
  parseOtp,
  passwordChecks,
  safeReturnTo,
} from "./validation";

describe("CPF", () => {
  it("aceita CPF válido com ou sem máscara", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });
  it("recusa dígito verificador errado, tamanho errado e sequências repetidas", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("1234567890")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });
  it("máscara 000.000.000-00", () => {
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
    expect(maskCpf("5299")).toBe("529.9");
    expect(maskCpf("abc")).toBe("");
  });
});

describe("máscaras", () => {
  it("celular (00) 0 0000-0000", () => {
    expect(maskPhone("82999998888")).toBe("(82) 9 9999-8888");
    expect(maskPhone("8")).toBe("(8");
    expect(maskPhone("829")).toBe("(82) 9");
  });
  it("CEP 00.000-000", () => {
    expect(maskCep("57010000")).toBe("57.010-000");
    expect(maskCep("570")).toBe("57.0");
  });
});

describe("senha", () => {
  it("exige 8 a 64 caracteres com letras e números", () => {
    expect(isValidPassword("abc12345")).toBe(true);
    expect(isValidPassword("abcdefgh")).toBe(false);
    expect(isValidPassword("12345678")).toBe(false);
    expect(isValidPassword("ab12")).toBe(false);
    expect(passwordChecks("a".repeat(65) + "1").length).toBe(false);
  });
});

describe("login e código", () => {
  it("identificador: e-mail ou CPF de 11 dígitos", () => {
    expect(isLoginIdentifier("ana@email.com")).toBe(true);
    expect(isLoginIdentifier("529.982.247-25")).toBe(true);
    expect(isLoginIdentifier("1234")).toBe(false);
    expect(isLoginIdentifier("  ")).toBe(false);
  });
  it("código ignora letras e passa de 6 dígitos", () => {
    expect(parseOtp("12a3-45 6789")).toBe("123456");
  });
});

describe("utilidades", () => {
  it("returnTo só aceita caminho do próprio site", () => {
    expect(safeReturnTo("/p/tenis")).toBe("/p/tenis");
    expect(safeReturnTo("https://x.com")).toBe("/");
    expect(safeReturnTo("//x.com")).toBe("/");
    expect(safeReturnTo("/\\x.com")).toBe("/");
    expect(safeReturnTo(null, "/explorar")).toBe("/explorar");
  });
  it("primeiro nome e relógio", () => {
    expect(firstName("  Maria  da Silva")).toBe("Maria");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(-3)).toBe("0:00");
  });
});
