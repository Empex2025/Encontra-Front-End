import { describe, expect, it } from "vitest";

import { countdownText, msLeft, offerEnded, routeUrl } from "./offer";

describe("offer", () => {
  it("contagem regressiva", () => {
    expect(countdownText(3_661_000)).toBe("01:01:01");
    expect(countdownText(59_000)).toBe("00:00:59");
    expect(countdownText(3 * 86_400_000)).toBe("3 dias");
  });
  it("msLeft nunca fica negativo e data inválida não encerra", () => {
    expect(msLeft("2026-10-12T10:00:00Z", Date.parse("2026-10-12T11:00:00Z"))).toBe(0);
    expect(msLeft("2026-10-12T12:00:00Z", Date.parse("2026-10-12T11:00:00Z"))).toBe(3_600_000);
    expect(msLeft("lixo", 0)).toBeNull();
    expect(offerEnded("active", null)).toBe(false);
  });
  it("encerrada por status ou por prazo", () => {
    expect(offerEnded("ended", 5000)).toBe(true);
    expect(offerEnded("active", 0)).toBe(true);
    expect(offerEnded("active", 5000)).toBe(false);
  });
  it("rota prefere coordenadas e não inventa destino", () => {
    expect(routeUrl({ lat: -9.6, lng: -35.7, address: "Rua A" })).toContain("destination=-9.6,-35.7");
    expect(routeUrl({ lat: null, lng: null, address: "Rua A, 10" })).toContain("query=Rua%20A%2C%2010");
    expect(routeUrl({ lat: null, lng: null, address: null })).toBeNull();
  });
});
