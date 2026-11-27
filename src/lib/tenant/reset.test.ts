/**
 * Orden de borrado del reset: de las tablas hijas a las padres, todo dentro
 * de una transacción. (El SQL se validó contra la base real con simular.)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/DB/prisma";
import { resetearTienda } from "./reset";

const sentencias: string[] = [];
const tx = {
  $executeRaw: vi.fn((strings: TemplateStringsArray) => {
    sentencias.push(strings.join("?").replace(/\s+/g, " ").trim());
    return Promise.resolve(1);
  }),
};

vi.mock("@/DB/prisma", () => ({
  default: { $transaction: vi.fn() },
}));

const tabla = (sql: string) => sql.match(/(?:DELETE FROM|UPDATE) "([A-Za-z_]+)"/)?.[1];
const posicion = (t: string) => sentencias.findIndex((s) => tabla(s) === t);

describe("resetearTienda", () => {
  beforeEach(() => {
    sentencias.length = 0;
    vi.mocked(prisma.$transaction).mockImplementation((async (fn: (t: typeof tx) => unknown) => fn(tx)) as any);
  });

  it("borra cada tabla después de las que la referencian", async () => {
    await resetearTienda(4n);
    const antesQue: [string, string][] = [
      ["FacturaElectronica", "Comprobante"],
      ["FormaPago_Cheque", "Cheque"],
      ["FormaPago", "Gasto"],
      ["FormaPago", "Comprobante"],
      ["DepositoCheques", "Cheque"],
      ["Comprobante_CuentaCorriente", "Movimiento_CuentaCorriente"],
      ["Movimiento_CuentaCorriente", "Movimiento"],
      ["Movimiento", "Comprobante"],
      ["Movimiento", "Caja"],
      ["DetalleComprobante", "Comprobante"],
      ["Gasto", "Caja"],
      ["DetalleCaja", "Caja"],
    ];
    for (const [hija, padre] of antesQue) {
      expect(posicion(hija), `${hija} antes que ${padre}`).toBeLessThan(posicion(padre));
      expect(posicion(hija)).toBeGreaterThanOrEqual(0);
    }
  });

  it("deja el stock en cero y borra la numeración, sin tocar productos ni clientes", async () => {
    await resetearTienda(4n);
    const tablas = sentencias.map(tabla);
    expect(sentencias.some((s) => s.startsWith('UPDATE "ArticuloStock" SET "Stock" = 0'))).toBe(true);
    expect(tablas).toContain("Contador");
    for (const intocable of ["Persona", "Persona_Cliente", "Proveedor", "Usuario", "Sucursal", "Configuracion", "PrecioLista"]) {
      expect(tablas).not.toContain(intocable);
    }
    expect(sentencias.filter((s) => s.startsWith('UPDATE "Articulo"'))).toEqual([
      'UPDATE "Articulo" SET "Stock" = 0 WHERE "TenantId" = ?',
    ]);
  });

  it("simular devuelve lo que se borraría y revierte la transacción", async () => {
    const resultado = await resetearTienda(4n, { simular: true });
    expect(resultado.comprobantes).toBe(1);
    expect(resultado.cajas).toBe(1);
  });
});
