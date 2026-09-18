import { describe, expect, it } from "vitest";
import { normalizeFormaPago, normalizeTicketItem } from "./TicketImpresion";

describe("TicketImpresion normalization", () => {
  it("normalizes item fields from the reprint payload", () => {
    const item = {
      descripcion: "Coca Cola 600ml",
      cantidad: 2,
      precio: 1200,
      subtotal: 2400,
    };

    expect(normalizeTicketItem(item)).toMatchObject({
      Descripcion: "Coca Cola 600ml",
      cantidad: 2,
      precio: 1200,
      subtotal: 2400,
    });
  });

  it("normalizes payment fields from the reprint payload", () => {
    const formaPago = {
      tipo: 1,
      monto: 2500,
    };

    expect(normalizeFormaPago(formaPago)).toMatchObject({
      tipoPago: 1,
      monto: 2500,
    });
  });
});
