import { describe, expect, it } from "vitest";

import { orderCardView, type OrderRequest } from "./order-card";

const base: OrderRequest = { id: "1", kind: "booking", title: "Troca de tomada", rows: [], status: "open" };
const ids = (r: OrderRequest) => orderCardView(r, "Luz").actions.map((a) => a.id);

describe("orderCardView", () => {
  it("horário agendado: confirmar, remarcar e cancelar", () => {
    expect(ids(base)).toEqual(["done", "reschedule", "cancel"]);
    expect(orderCardView(base, "Luz").actions[0].label).toBe("Serviço realizado");
  });
  it("orçamento e solicitação: sem remarcar; produto: só confirmar o recebimento", () => {
    expect(ids({ ...base, kind: "quote" })).toEqual(["done", "cancel"]);
    expect(ids({ ...base, kind: "product" })).toEqual(["done"]);
    expect(orderCardView({ ...base, kind: "product" }, "Loja").actions[0].label).toBe("Recebi meu produto");
  });
  it("depois de confirmar pede a nota; depois da nota oferece etiquetas e não há mais ações", () => {
    const d = orderCardView({ ...base, status: "done" }, "Luz");
    expect(d.askRating).toBe(true);
    expect(d.actions).toEqual([]);
    const r = orderCardView({ ...base, status: "rated", rating: 5 }, "Luz");
    expect(r.askRating).toBe(false);
    expect(r.tagOptions.length).toBeGreaterThan(0);
  });
  it("cancelado e remarcação não têm ações e usam tom próprio", () => {
    expect(orderCardView({ ...base, status: "cancelled" }, "Luz")).toMatchObject({ tone: "danger", actions: [] });
    expect(orderCardView({ ...base, status: "rescheduling" }, "Luz")).toMatchObject({ tone: "warn", actions: [] });
  });
});
