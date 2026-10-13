import { describe, expect, it } from "vitest";

import {
  afterRemoval,
  canRemoveAddress,
  cleanPhoneInput,
  deletionDate,
  filterFaq,
  initials,
  interestsError,
  normalizeText,
  profileChanged,
  validateContact,
  validateDeletion,
  validateNewAddress,
  validatePhone,
  validateProfile,
  validateReport,
} from "./account";

describe("perfil", () => {
  it("exige nome e sobrenome e e-mail válido", () => {
    expect(validateProfile({ name: "Maria", email: "a@b.co" }).name).toBe("Escreva nome e sobrenome.");
    expect(validateProfile({ name: "Maria Souza", email: "x" }).email).toBe("Confira o e-mail.");
    expect(validateProfile({ name: "Maria Souza", email: "a@b.co" })).toEqual({});
    expect(validateProfile({ name: "A ".repeat(40), email: "a@b.co" }).name).toBeDefined();
  });
  it("iniciais", () => {
    expect(initials("Maria da Silva")).toBe("MS");
    expect(initials("  ana ")).toBe("AN");
    expect(initials("")).toBe("?");
  });
  it("celular", () => {
    expect(cleanPhoneInput("(82) 9 9999-8888abc+")).toBe("(82) 9 9999-8888");
    expect(cleanPhoneInput("1".repeat(30))).toHaveLength(16);
    expect(validatePhone("(82) 9999")).toBe("Digite o celular com DDD.");
    expect(validatePhone("(82) 99999-8888")).toBeNull();
  });
  it("só salva se mudou", () => {
    expect(profileChanged({ name: "A B", email: "a@b.co" }, { name: " A B ", email: "a@b.co" })).toBe(false);
    expect(profileChanged({ name: "A B", email: "a@b.co" }, { name: "A C", email: "a@b.co" })).toBe(true);
  });
});

describe("endereços e interesses", () => {
  it("novo endereço pede CEP e endereço", () => {
    expect(validateNewAddress({ cep: "57000", street: "Rua" })).toBe("Preencha CEP e endereço.");
    expect(validateNewAddress({ cep: "57000-000", street: " " })).toBe("Preencha CEP e endereço.");
    expect(validateNewAddress({ cep: "57000-000", street: "Rua A" })).toBeNull();
  });
  it("nunca remove o último e promove outro principal", () => {
    expect(canRemoveAddress(1)).toBe(false);
    expect(canRemoveAddress(2)).toBe(true);
    const r = afterRemoval(
      [
        { id: "1", main: true },
        { id: "2", main: false },
      ],
      "1",
    );
    expect(r).toEqual([{ id: "2", main: true }]);
  });
  it("mínimo de 3 interesses", () => {
    expect(interestsError(2)).toBe("Mantenha pelo menos 3 interesses.");
    expect(interestsError(3)).toBeNull();
  });
});

describe("exclusão", () => {
  it("pede senha e caixa marcada", () => {
    expect(validateDeletion({ password: "", confirmed: false })).toEqual({
      password: "Digite sua senha para confirmar.",
      confirmed: "Marque a caixa para confirmar.",
    });
    expect(validateDeletion({ password: "x", confirmed: true })).toEqual({});
  });
  it("data é hoje + 30 dias", () => {
    expect(deletionDate(new Date(2026, 9, 12, 12))).toBe("11 de novembro de 2026");
  });
});

describe("ajuda", () => {
  const items = [
    { categoryId: "a", question: "Como crio um alerta?", answer: "Toque em Avise-me." },
    { categoryId: "b", question: "Posso excluir minha conta?", answer: "Sim, em Privacidade." },
  ];
  it("busca sem acento nem maiúscula, ignorando categoria", () => {
    expect(normalizeText("  AVISÉ-me ")).toBe("avise-me");
    expect(filterFaq(items, "EXCLUIR", "a")).toHaveLength(1);
    expect(filterFaq(items, "privacidade", null)[0].categoryId).toBe("b");
  });
  it("sem texto, filtra pela categoria", () => {
    expect(filterFaq(items, "", "a")).toHaveLength(1);
    expect(filterFaq(items, "", null)).toHaveLength(2);
  });
  it("fale conosco", () => {
    expect(validateContact({ subject: "", message: "curto" })).toEqual({
      subject: "Escolha um assunto.",
      message: "Escreva pelo menos 10 caracteres.",
    });
    expect(validateContact({ subject: "x", message: "mensagem longa o bastante" })).toEqual({});
  });
});

describe("denúncia", () => {
  it("tipo, nome, motivo e descrição", () => {
    const e = validateReport({ type: "", name: "", reason: "", description: "" });
    expect(Object.keys(e)).toEqual(["type", "name", "reason", "description"]);
    expect(
      validateReport({ type: "outro", name: "", reason: "Golpe ou fraude", description: "é um golpe mesmo" }),
    ).toEqual({});
  });
});
