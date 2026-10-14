import { describe, expect, it } from "vitest";

import {
  cnpjSignal,
  priceSignal,
  stockSignal,
  textSignal,
  updatedSignal,
  updatedText,
  verificationSignal,
} from "./trust";

const now = new Date("2026-10-14T12:00:00-03:00");

describe("sinais de confiança", () => {
  it("verificação: só diz 'Verificado' quando o servidor disse", () => {
    expect(verificationSignal("verified").value).toBe("Verificado");
    expect(verificationSignal("pending").value).toBe("Em análise");
    expect(verificationSignal("none").value).toBe("Não verificado");
    expect(verificationSignal(undefined)).toMatchObject({ value: "Não informado", tone: "unknown" });
  });

  it("CNPJ: ausência não vira 'não verificado'", () => {
    expect(cnpjSignal(true).value).toBe("Verificado");
    expect(cnpjSignal(false).value).toBe("Não verificado");
    expect(cnpjSignal(undefined).value).toBe("Não informado");
  });

  it("data de atualização: relativa e com dia/mês; inválida ou ausente é null", () => {
    expect(updatedText("2026-10-11T12:00:00-03:00", now)).toBe("há 3 dias (11/10)");
    expect(updatedText(null, now)).toBeNull();
    expect(updatedText("ontem", now)).toBeNull();
  });

  it("preço: sempre 'informado pela loja'; sem preço não inventa", () => {
    expect(priceSignal(null, now)).toMatchObject({ value: "Não informado", tone: "unknown" });
    expect(priceSignal({ updatedAt: "2026-10-11T12:00:00-03:00" }, now).value).toBe(
      "Informado pela loja há 3 dias (11/10)",
    );
    const semData = priceSignal({ updatedAt: null }, now);
    expect(semData.value).toBe("Informado pela loja");
    expect(semData.hint).toMatch(/não informada/);
  });

  it("disponibilidade: nunca afirma como fato atual; pede para confirmar quando falta data", () => {
    expect(stockSignal({ state: "unknown" }, now)).toMatchObject({ value: "Não informado", tone: "unknown" });
    const a = stockSignal({ state: "available" }, now);
    expect(a.value).toBe("Informada pela loja: disponível");
    expect(a.hint).toMatch(/Confirme com a loja/);
    const b = stockSignal({ state: "unavailable", updatedAt: "2026-10-13T12:00:00-03:00" }, now);
    expect(b.value).toBe("Informada pela loja: indisponível");
    expect(b.hint).toBe("Atualizada há 1 dia (13/10).");
  });

  it("texto e atualização genéricos: vazio vira 'Não informado', nunca 0", () => {
    expect(textSignal("Resposta", null).value).toBe("Não informado");
    expect(textSignal("Resposta", "").value).toBe("Não informado");
    expect(textSignal("Respondem", 0, "%").value).toBe("0%");
    expect(updatedSignal("Perfil", null, now).value).toBe("Não informado");
    expect(updatedSignal("Perfil", "2026-10-11T12:00:00-03:00", now).value).toBe("Há 3 dias (11/10)");
  });
});
