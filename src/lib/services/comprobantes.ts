import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  TIPO_COMPROBANTE_VENTA,
  TIPO_PAGO,
  ESTADO_FACTURA,
} from "@/lib/constants/comprobantes";

// Types
export type TransactionClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Schemas
export const detalleComprobanteSchema = z.object({
  articuloId: z.number().int().positive(),
  codigo: z.string(),
  descripcion: z.string(),
  cantidad: z.number().positive(),
  precio: z.number().nonnegative(),
  iva: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  costo: z.number().nonnegative().optional().default(0),
});

export const formaPagoSchema = z.object({
  tipoPago: z.number().int().min(1).max(5),
  monto: z.number().positive(),
  tarjetaId: z.number().int().positive().optional(),
  numeroTarjeta: z.string().optional(),
  cuponPago: z.string().optional(),
  cantidadCuotas: z.number().int().positive().optional(),
  chequeId: z.number().int().positive().optional(),
  clienteId: z.number().int().positive().optional(),
});

export const createComprobanteBaseSchema = z.object({
  tipoComprobante: z.number().int().min(1).max(7), // Updated range
  clienteId: z.number().int().nonnegative().nullable().optional(),
  fecha: z.string().optional(),
  descuento: z.number().nonnegative().optional().default(0),
  detalles: z.array(detalleComprobanteSchema).min(1),
  formasPago: z.array(formaPagoSchema).min(1),
  // Additional fields for specific types
  comprobanteAsociadoId: z.number().int().positive().optional(), // For Nota de Credito
});

export type CreateComprobanteData = z.infer<typeof createComprobanteBaseSchema>;

export async function ensureConsumerFinal(
  tx: TransactionClient,
  tenantId: bigint
) {
  const condicionIvaConsumidorFinal = await tx.condicionIva.findFirst({
    where: {
      Descripcion: { contains: "Consumidor Final", mode: "insensitive" },
      EstaEliminado: false,
    },
  });

  let condicionIvaId = condicionIvaConsumidorFinal?.Id;

  if (!condicionIvaId) {
    const nuevaCondicionIva = await tx.condicionIva.create({
      data: {
        Descripcion: "Consumidor Final",
        EstaEliminado: false,
      },
    });
    condicionIvaId = nuevaCondicionIva.Id;
  }

  const clienteExistente = await tx.persona_Cliente.findFirst({
    where: {
      Persona: {
        TenantId: tenantId,
        Nombre: "Consumidor",
        Apellido: "Final",
        EstaEliminado: false,
      },
    },
    include: {
      Persona: true,
    },
  });

  if (clienteExistente) {
    return Number(clienteExistente.Id);
  } else {
    // Usar una localidad dummy o por defecto
    const LOCALIDAD_DUMMY_ID = 2014010;

    // Check if dummy locality exists, if not use any
    // For now assuming it exists or catching error?
    // Ideally we should look up a valid locality ID.
    // To stay safe I'll use the ID from the original code.

    const persona = await tx.persona.create({
      data: {
        TenantId: tenantId,
        Nombre: "Consumidor",
        Apellido: "Final",
        Direccion: "Sin dirección",
        Mail: "consumidorfinal@example.com",
        LocalidadId: BigInt(LOCALIDAD_DUMMY_ID),
        EstaEliminado: false,
      },
    });

    const cliente = await tx.persona_Cliente.create({
      data: {
        Id: persona.Id,
        CondicionIvaId: condicionIvaId!,
        ActivarCtaCte: false,
        TieneLimiteCompra: false,
        MontoMaximoCtaCte: 0,
      },
    });

    return Number(cliente.Id);
  }
}

// Helpers
async function createBaseComprobante(
  tx: TransactionClient,
  data: CreateComprobanteData,
  tenantId: bigint,
  usuarioId: bigint,
  empleadoId: bigint,
  numero: number,
  descuentaStock: boolean,
  cajaId?: bigint
) {
  // Totals
  const subtotal = data.detalles.reduce((sum, d) => sum + d.subtotal, 0);
  const descuento = data.descuento || 0;
  const subtotalConDescuento = subtotal - descuento;

  // IVA Calc (Placeholder, passed values should be prioritized if we added them to schema)

  const total = subtotalConDescuento;
  const fecha = data.fecha ? new Date(data.fecha) : new Date();

  const comprobante = await tx.comprobante.create({
    data: {
      TenantId: tenantId,
      EmpleadoId: empleadoId,
      UsuarioId: usuarioId,
      Fecha: fecha,
      Numero: numero,
      SubTotal: subtotal,
      Descuento: descuento,
      Total: total,
      Iva21: 0,
      Iva105: 0,
      TipoComprobante: data.tipoComprobante,
      EstaEliminado: false,
    },
  });

  // Fetch articles for stock handling
  const articleIds = data.detalles.map((d) => BigInt(d.articuloId));
  const articulos = await tx.articulo.findMany({
    where: { Id: { in: articleIds }, TenantId: tenantId },
    select: { Id: true, DescuentaStock: true },
  });

  // Create Details & Update Stock
  for (const detalle of data.detalles) {
    await tx.detalleComprobante.create({
      data: {
        TenantId: tenantId,
        ComprobanteId: comprobante.Id,
        ArticuloId: BigInt(detalle.articuloId),
        Codigo: detalle.codigo,
        Descripcion: detalle.descripcion,
        Cantidad: detalle.cantidad,
        Iva: detalle.iva,
        Precio: detalle.precio,
        SubTotal: detalle.subtotal,
        Costo: detalle.costo || 0,
        EstaEliminado: false,
      },
    });

    if (descuentaStock) {
      const art = articulos.find(
        (a: { Id: bigint; DescuentaStock: boolean }) =>
          a.Id === BigInt(detalle.articuloId)
      );
      if (art && art.DescuentaStock) {
        await tx.articulo.update({
          where: { Id: art.Id },
          data: {
            Stock: {
              decrement: detalle.cantidad,
            },
          },
        });
      }
    }
  }

  // Create FormasPago
  for (const formaPago of data.formasPago) {
    const fp = await tx.formaPago.create({
      data: {
        TenantId: tenantId,
        ComprobanteId: comprobante.Id,
        TipoPago: formaPago.tipoPago,
        Monto: formaPago.monto,
        EstaEliminado: false,
      },
    });

    if (formaPago.tipoPago === TIPO_PAGO.TARJETA && formaPago.tarjetaId) {
      await tx.formaPago_Tarjeta.create({
        data: {
          Id: fp.Id,
          TarjetaId: BigInt(formaPago.tarjetaId),
          NumeroTarjeta: formaPago.numeroTarjeta || "",
          CuponPago: formaPago.cuponPago || "",
          CantidadCuotas: formaPago.cantidadCuotas || 1,
        },
      });
    } else if (
      formaPago.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE &&
      formaPago.clienteId
    ) {
      await tx.formaPago_CtaCte.create({
        data: {
          Id: fp.Id,
          ClienteId: BigInt(formaPago.clienteId),
        },
      });
    } else if (formaPago.tipoPago === TIPO_PAGO.CHEQUE && formaPago.chequeId) {
      await tx.formaPago_Cheque.create({
        data: {
          Id: fp.Id,
          ChequeId: BigInt(formaPago.chequeId),
        },
      });
    }
  }

  // Create Movimiento and Update Caja if cajaId provided
  let movimiento;

  if (cajaId) {
    const isNotaCredito =
      data.tipoComprobante === TIPO_COMPROBANTE_VENTA.NOTA_CREDITO;
    const esSalida = isNotaCredito; // Facturas son entradas, NC son salidas (generalmente)
    const tipoMovimiento = esSalida ? 2 : 1;

    let descripcionMov = `Venta - Comp #${numero}`;
    if (
      data.tipoComprobante === TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE
    ) {
      descripcionMov = `Pago Cta Cte - Comp #${numero}`;
    } else if (isNotaCredito) {
      descripcionMov = `Nota Crédito - Comp #${numero}`;
    }

    movimiento = await tx.movimiento.create({
      data: {
        CajaId: cajaId,
        TenantId: tenantId,
        UsuarioId: usuarioId,
        ComprobanteId: comprobante.Id,
        Monto: comprobante.Total, // El movimiento refleja el total del comprobante
        Fecha: new Date(),
        Descripcion: descripcionMov,
        TipoMovimiento: tipoMovimiento,
        EstaEliminado: false,
      },
    });

    // Update Caja & DetalleCaja
    for (const formaPago of data.formasPago) {
      if (!formaPago.monto || formaPago.monto === 0) continue;

      let fieldToUpdate: string | undefined;

      // Determine field based on TipoPago
      switch (formaPago.tipoPago) {
        case TIPO_PAGO.EFECTIVO:
          fieldToUpdate = esSalida
            ? "TotalSalidaEfectivo"
            : "TotalEntradaEfectivo";
          break;
        case TIPO_PAGO.TARJETA:
          fieldToUpdate = esSalida
            ? "TotalSalidaTarjeta"
            : "TotalEntradaTarjeta";
          break;
        case TIPO_PAGO.CHEQUE:
          fieldToUpdate = esSalida ? "TotalSalidaCheque" : "TotalEntradaCheque";
          break;
        case TIPO_PAGO.CUENTA_CORRIENTE:
          fieldToUpdate = esSalida ? "TotalSalidaCtaCte" : "TotalEntradaCtaCte";
          break;
        case TIPO_PAGO.TRANSFERENCIA:
          fieldToUpdate = esSalida ? "TotalSalidaTransf" : "TotalEntradaTransf";
          break;
      }

      if (fieldToUpdate) {
        await tx.caja.update({
          where: { Id: cajaId },
          data: {
            [fieldToUpdate]: {
              increment: formaPago.monto,
            },
          },
        });
      }

      // Update or Create DetalleCaja
      // Check if exists
      const detalleCajaParams = {
        CajaId: cajaId,
        TipoPago: formaPago.tipoPago,
        TenantId: tenantId,
      };

      const existingDetalle = await tx.detalleCaja.findFirst({
        where: {
          ...detalleCajaParams,
          EstaEliminado: false,
        },
      });

      if (existingDetalle) {
        if (esSalida) {
          await tx.detalleCaja.update({
            where: { Id: existingDetalle.Id },
            data: { Monto: { decrement: formaPago.monto } },
          });
        } else {
          await tx.detalleCaja.update({
            where: { Id: existingDetalle.Id },
            data: { Monto: { increment: formaPago.monto } },
          });
        }
      } else {
        // Create new
        // If Salida, starts negative?
        const initialMonto = esSalida ? -formaPago.monto : formaPago.monto;
        await tx.detalleCaja.create({
          data: {
            ...detalleCajaParams,
            Monto: initialMonto,
            EstaEliminado: false,
          },
        });
      }
    }
  }

  return { comprobante, movimiento };
}

// Specific Functions

export async function createFacturaA(
  tx: TransactionClient,
  data: CreateComprobanteData,
  tenantId: bigint,
  usuarioId: bigint,
  empleadoId: bigint,
  numero: number,
  clienteId: number,
  iva21: number,
  iva105: number,
  descuentaStock: boolean,
  cajaId?: bigint
) {
  const { comprobante } = await createBaseComprobante(
    tx,
    data,
    tenantId,
    usuarioId,
    empleadoId,
    numero,
    descuentaStock,
    cajaId
  );
  // Update IVA
  await tx.comprobante.update({
    where: { Id: comprobante.Id },
    data: { Iva21: iva21, Iva105: iva105 },
  });

  await tx.comprobante_Factura.create({
    data: {
      Id: comprobante.Id,
      ClienteId: BigInt(clienteId),
      Estado: ESTADO_FACTURA.CONFIRMADO,
    },
  });
  return comprobante;
}

export async function createFacturaB(
  tx: TransactionClient,
  data: CreateComprobanteData,
  tenantId: bigint,
  usuarioId: bigint,
  empleadoId: bigint,
  numero: number,
  clienteId: number,
  iva21: number,
  iva105: number,
  descuentaStock: boolean,
  cajaId?: bigint
) {
  const { comprobante } = await createBaseComprobante(
    tx,
    data,
    tenantId,
    usuarioId,
    empleadoId,
    numero,
    descuentaStock,
    cajaId
  );
  await tx.comprobante.update({
    where: { Id: comprobante.Id },
    data: { Iva21: iva21, Iva105: iva105 },
  });

  await tx.comprobante_Factura.create({
    data: {
      Id: comprobante.Id,
      ClienteId: BigInt(clienteId),
      Estado: ESTADO_FACTURA.CONFIRMADO,
    },
  });
  return comprobante;
}

export async function createFacturaC(
  tx: TransactionClient,
  data: CreateComprobanteData,
  tenantId: bigint,
  usuarioId: bigint,
  empleadoId: bigint,
  numero: number,
  clienteId: number,
  descuentaStock: boolean,
  cajaId?: bigint
) {
  // Factura C has NO IVA discriminator usually, but the table has fields.
  const { comprobante } = await createBaseComprobante(
    tx,
    data,
    tenantId,
    usuarioId,
    empleadoId,
    numero,
    descuentaStock,
    cajaId
  );

  await tx.comprobante_Factura.create({
    data: {
      Id: comprobante.Id,
      ClienteId: BigInt(clienteId),
      Estado: ESTADO_FACTURA.CONFIRMADO,
    },
  });
  return comprobante;
}

export async function createPresupuesto(
  tx: TransactionClient,
  data: CreateComprobanteData,
  tenantId: bigint,
  usuarioId: bigint,
  empleadoId: bigint,
  numero: number,
  clienteId: number,
  descuentaStock: boolean
) {
  const { comprobante } = await createBaseComprobante(
    tx,
    data,
    tenantId,
    usuarioId,
    empleadoId,
    numero,
    descuentaStock
  );
  await tx.comprobante_Presupuesto.create({
    data: {
      Id: comprobante.Id,
      ClienteId: BigInt(clienteId),
    },
  });
  return comprobante;
}

export async function createRemito(
  tx: TransactionClient,
  data: CreateComprobanteData,
  tenantId: bigint,
  usuarioId: bigint,
  empleadoId: bigint,
  numero: number,
  clienteId: number,
  descuentaStock: boolean
) {
  const { comprobante } = await createBaseComprobante(
    tx,
    data,
    tenantId,
    usuarioId,
    empleadoId,
    numero,
    descuentaStock
  );
  await tx.comprobante_Remito.create({
    data: {
      Id: comprobante.Id,
      ClienteId: BigInt(clienteId),
    },
  });
  return comprobante;
}

export async function createNotaCredito(
  tx: TransactionClient,
  data: CreateComprobanteData,
  tenantId: bigint,
  usuarioId: bigint,
  empleadoId: bigint,
  numero: number,
  clienteId: number,
  iva21: number,
  iva105: number,
  descuentaStock: boolean,
  cajaId?: bigint
) {
  if (!data.comprobanteAsociadoId) {
    throw new Error("Comprobante asociado requerido para Nota de Crédito");
  }

  const { comprobante } = await createBaseComprobante(
    tx,
    data,
    tenantId,
    usuarioId,
    empleadoId,
    numero,
    descuentaStock,
    cajaId
  );
  await tx.comprobante.update({
    where: { Id: comprobante.Id },
    data: { Iva21: iva21, Iva105: iva105 },
  });

  await tx.comprobante_NotaCredito.create({
    data: {
      Id: comprobante.Id,
      ComprobanteId: BigInt(data.comprobanteAsociadoId),
    },
  });
  return comprobante;
}

export async function createCuentaCorrienteCliente(
  tx: TransactionClient,
  data: CreateComprobanteData,
  tenantId: bigint,
  usuarioId: bigint,
  empleadoId: bigint,
  numero: number,
  clienteId: number,
  cajaId: bigint
) {
  // This is typically for a Payment Receipt on Account (Cobranza). Does it affect stock? PROBABLY NOT.
  // We pass descuentaStock=false
  // Movimiento logic is now handled in createBaseComprobante
  const { comprobante, movimiento } = await createBaseComprobante(
    tx,
    data,
    tenantId,
    usuarioId,
    empleadoId,
    numero,
    false,
    cajaId
  );

  if (!movimiento) {
    throw new Error("Error interno: no se generó el movimiento de caja.");
  }

  // Create Movimiento_CuentaCorriente
  const movCtaCte = await tx.movimiento_CuentaCorriente.create({
    data: {
      Id: movimiento.Id,
      ClienteId: BigInt(clienteId),
    },
  });

  // Link
  await tx.comprobante_CuentaCorriente.create({
    data: {
      Id: comprobante.Id,
      ClienteId: BigInt(clienteId),
      MovimientoCuentaCorrienteId: movCtaCte.Id,
    },
  });

  return comprobante;
}

// Errores.
// Falta calcular el iva en detalle de  comprobante.
