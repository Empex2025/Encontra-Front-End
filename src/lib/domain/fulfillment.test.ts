import { describe, expect, it } from "vitest";

import { fulfillmentLabel } from "./fulfillment";

describe("fulfillmentLabel", () => {
  it("produto: entrega com valor, grátis e só retirada", () => {
    expect(fulfillmentLabel({ delivers: true, feeCents: 1000 }, "product")).toMatchObject({ icon: "delivery", text: expect.stringMatching(/^Entrega R\$/) });
    expect(fulfillmentLabel({ delivers: true, feeCents: 0 }, "product")?.text).toBe("Entrega grátis");
    expect(fulfillmentLabel({ delivers: true }, "product")?.text).toBe("Entrega grátis");
    expect(fulfillmentLabel({ delivers: false }, "product")).toEqual({ text: "Só retirada", icon: "pickup" });
  });
  it("serviço: na casa (com taxa ou sem) e online; no local do prestador não mostra nada", () => {
    expect(fulfillmentLabel({ serviceVenue: "home", feeCents: 2000 }, "service")?.text).toMatch(/^Na sua casa · \+R\$/);
    expect(fulfillmentLabel({ serviceVenue: "home" }, "service")?.text).toBe("Na sua casa");
    expect(fulfillmentLabel({ serviceVenue: "online" }, "service")?.icon).toBe("online");
    expect(fulfillmentLabel({ serviceVenue: null }, "service")).toBeNull();
  });
  it("sem informação não mostra nada", () => {
    expect(fulfillmentLabel(null, "product")).toBeNull();
    expect(fulfillmentLabel({}, "product")).toBeNull();
  });
});
