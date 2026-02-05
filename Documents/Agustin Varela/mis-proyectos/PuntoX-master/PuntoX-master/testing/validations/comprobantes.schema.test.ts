/**
 * Tests para los schemas de validación de comprobantes
 */
import { describe, it, expect } from "vitest";
import {
  detalleComprobanteSchema,
  formaPagoSchema,
  createComprobanteBaseSchema,
} from "@/lib/services/comprobantes";

describe("detalleComprobanteSchema", () => {
  it("debe validar un detalle de comprobante correcto", () => {
    const data = {
      articuloId: 1,
      codigo: "PROD001",
      descripcion: "Producto de prueba",
      cantidad: 2,
      precio: 100.50,
      iva: 21.10,
      subtotal: 201.00,
      costo: 80.00,
    };

    const result = detalleComprobanteSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.articuloId).toBe(1);
      expect(result.data.cantidad).toBe(2);
      expect(result.data.precio).toBe(100.50);
    }
  });

  it("debe rechazar cuando falta articuloId", () => {
    const data = {
      codigo: "PROD001",
      descripcion: "Producto",
      cantidad: 1,
      precio: 100,
      iva: 21,
      subtotal: 100,
    };

    const result = detalleComprobanteSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("debe rechazar articuloId negativo o cero", () => {
    const data1 = {
      articuloId: -1,
      codigo: "PROD001",
      descripcion: "Producto",
      cantidad: 1,
      precio: 100,
      iva: 21,
      subtotal: 100,
    };

    const data2 = {
      articuloId: 0,
      codigo: "PROD001",
      descripcion: "Producto",
      cantidad: 1,
      precio: 100,
      iva: 21,
      subtotal: 100,
    };

    expect(detalleComprobanteSchema.safeParse(data1).success).toBe(false);
    expect(detalleComprobanteSchema.safeParse(data2).success).toBe(false);
  });

  it("debe rechazar cantidad negativa o cero", () => {
    const data1 = {
      articuloId: 1,
      codigo: "PROD001",
      descripcion: "Producto",
      cantidad: -1,
      precio: 100,
      iva: 21,
      subtotal: 100,
    };

    const data2 = {
      articuloId: 1,
      codigo: "PROD001",
      descripcion: "Producto",
      cantidad: 0,
      precio: 100,
      iva: 21,
      subtotal: 100,
    };

    expect(detalleComprobanteSchema.safeParse(data1).success).toBe(false);
    expect(detalleComprobanteSchema.safeParse(data2).success).toBe(false);
  });

  it("debe rechazar precios negativos", () => {
    const data = {
      articuloId: 1,
      codigo: "PROD001",
      descripcion: "Producto",
      cantidad: 1,
      precio: -100,
      iva: 21,
      subtotal: 100,
    };

    expect(detalleComprobanteSchema.safeParse(data).success).toBe(false);
  });

  it("debe usar costo por defecto si no se proporciona", () => {
    const data = {
      articuloId: 1,
      codigo: "PROD001",
      descripcion: "Producto",
      cantidad: 1,
      precio: 100,
      iva: 21,
      subtotal: 100,
    };

    const result = detalleComprobanteSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.costo).toBe(0);
    }
  });
});

describe("formaPagoSchema", () => {
  it("debe validar una forma de pago correcta", () => {
    const data = {
      tipoPago: 1,
      monto: 100.50,
    };

    const result = formaPagoSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tipoPago).toBe(1);
      expect(result.data.monto).toBe(100.50);
    }
  });

  it("debe validar forma de pago con tarjeta", () => {
    const data = {
      tipoPago: 2,
      monto: 200,
      tarjetaId: 1,
      numeroTarjeta: "1234",
      cuponPago: "ABC123",
      cantidadCuotas: 3,
    };

    const result = formaPagoSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tarjetaId).toBe(1);
      expect(result.data.cantidadCuotas).toBe(3);
    }
  });

  it("debe validar forma de pago con cuenta corriente", () => {
    const data = {
      tipoPago: 4,
      monto: 300,
      clienteId: 10,
    };

    const result = formaPagoSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clienteId).toBe(10);
    }
  });

  it("debe rechazar tipoPago fuera del rango válido", () => {
    const data1 = {
      tipoPago: 0,
      monto: 100,
    };

    const data2 = {
      tipoPago: 6,
      monto: 100,
    };

    expect(formaPagoSchema.safeParse(data1).success).toBe(false);
    expect(formaPagoSchema.safeParse(data2).success).toBe(false);
  });

  it("debe rechazar monto negativo o cero", () => {
    const data1 = {
      tipoPago: 1,
      monto: -100,
    };

    const data2 = {
      tipoPago: 1,
      monto: 0,
    };

    expect(formaPagoSchema.safeParse(data1).success).toBe(false);
    expect(formaPagoSchema.safeParse(data2).success).toBe(false);
  });

  it("debe rechazar cantidadCuotas negativa o cero", () => {
    const data = {
      tipoPago: 2,
      monto: 100,
      tarjetaId: 1,
      cantidadCuotas: 0,
    };

    expect(formaPagoSchema.safeParse(data).success).toBe(false);
  });
});

describe("createComprobanteBaseSchema", () => {
  it("debe validar un comprobante base correcto", () => {
    const data = {
      tipoComprobante: 1,
      clienteId: 10,
      fecha: "2024-01-01",
      descuento: 10,
      detalles: [
        {
          articuloId: 1,
          codigo: "PROD001",
          descripcion: "Producto",
          cantidad: 1,
          precio: 100,
          iva: 21,
          subtotal: 100,
        },
      ],
      formasPago: [
        {
          tipoPago: 1,
          monto: 100,
        },
      ],
    };

    const result = createComprobanteBaseSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando falta detalles", () => {
    const data = {
      tipoComprobante: 1,
      formasPago: [
        {
          tipoPago: 1,
          monto: 100,
        },
      ],
    };

    expect(createComprobanteBaseSchema.safeParse(data).success).toBe(false);
  });

  it("debe rechazar cuando detalles está vacío", () => {
    const data = {
      tipoComprobante: 1,
      detalles: [],
      formasPago: [
        {
          tipoPago: 1,
          monto: 100,
        },
      ],
    };

    expect(createComprobanteBaseSchema.safeParse(data).success).toBe(false);
  });

  it("debe rechazar cuando falta formasPago", () => {
    const data = {
      tipoComprobante: 1,
      detalles: [
        {
          articuloId: 1,
          codigo: "PROD001",
          descripcion: "Producto",
          cantidad: 1,
          precio: 100,
          iva: 21,
          subtotal: 100,
        },
      ],
    };

    expect(createComprobanteBaseSchema.safeParse(data).success).toBe(false);
  });

  it("debe rechazar tipoComprobante fuera del rango válido", () => {
    const data = {
      tipoComprobante: 0,
      detalles: [
        {
          articuloId: 1,
          codigo: "PROD001",
          descripcion: "Producto",
          cantidad: 1,
          precio: 100,
          iva: 21,
          subtotal: 100,
        },
      ],
      formasPago: [
        {
          tipoPago: 1,
          monto: 100,
        },
      ],
    };

    expect(createComprobanteBaseSchema.safeParse(data).success).toBe(false);
  });

  it("debe aceptar clienteId como null o undefined", () => {
    const data1 = {
      tipoComprobante: 1,
      clienteId: null,
      detalles: [
        {
          articuloId: 1,
          codigo: "PROD001",
          descripcion: "Producto",
          cantidad: 1,
          precio: 100,
          iva: 21,
          subtotal: 100,
        },
      ],
      formasPago: [
        {
          tipoPago: 1,
          monto: 100,
        },
      ],
    };

    const data2 = {
      tipoComprobante: 1,
      detalles: [
        {
          articuloId: 1,
          codigo: "PROD001",
          descripcion: "Producto",
          cantidad: 1,
          precio: 100,
          iva: 21,
          subtotal: 100,
        },
      ],
      formasPago: [
        {
          tipoPago: 1,
          monto: 100,
        },
      ],
    };

    expect(createComprobanteBaseSchema.safeParse(data1).success).toBe(true);
    expect(createComprobanteBaseSchema.safeParse(data2).success).toBe(true);
  });

  it("debe usar descuento por defecto si no se proporciona", () => {
    const data = {
      tipoComprobante: 1,
      detalles: [
        {
          articuloId: 1,
          codigo: "PROD001",
          descripcion: "Producto",
          cantidad: 1,
          precio: 100,
          iva: 21,
          subtotal: 100,
        },
      ],
      formasPago: [
        {
          tipoPago: 1,
          monto: 100,
        },
      ],
    };

    const result = createComprobanteBaseSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.descuento).toBe(0);
    }
  });
});
