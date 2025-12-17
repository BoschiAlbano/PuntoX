import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { z } from "zod";

// Constantes para tipos de comprobante
export const TIPO_COMPROBANTE = {
  FACTURA: 1,
  PRESUPUESTO: 2,
  REMITO: 3,
  NOTA_CREDITO: 4,
  NOTA_DEBITO: 5,
} as const;

// Constantes para tipos de pago
export const TIPO_PAGO = {
  EFECTIVO: 1,
  TARJETA: 2,
  CHEQUE: 3,
  CUENTA_CORRIENTE: 4,
  TRANSFERENCIA: 5,
} as const;

// Constantes para estados de factura
export const ESTADO_FACTURA = {
  PENDIENTE: 1,
  CONFIRMADO: 2,
  ANULADO: 3,
} as const;

// Schema para crear comprobante
const detalleComprobanteSchema = z.object({
  articuloId: z.number().int().positive(),
  codigo: z.string(),
  descripcion: z.string(),
  cantidad: z.number().positive(),
  precio: z.number().nonnegative(),
  iva: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  costo: z.number().nonnegative().optional().default(0),
});

const formaPagoSchema = z.object({
  tipoPago: z.number().int().min(1).max(5),
  monto: z.number().positive(),
  // Opcional: datos específicos según tipo de pago
  tarjetaId: z.number().int().positive().optional(),
  numeroTarjeta: z.string().optional(),
  cuponPago: z.string().optional(),
  cantidadCuotas: z.number().int().positive().optional(),
  chequeId: z.number().int().positive().optional(),
  clienteId: z.number().int().positive().optional(), // Para cuenta corriente
});

const createComprobanteSchema = z.object({
  tipoComprobante: z.number().int().min(1).max(5),
  clienteId: z.number().int().nonnegative().nullable().optional(), // Permite null o 0 para Consumidor Final
  puestoTrabajoId: z.number().int().positive().optional(), // Requerido solo para facturas
  fecha: z.string().optional(), // ISO date string, opcional (usa fecha actual si no se proporciona)
  descuento: z.number().nonnegative().optional().default(0),
  detalles: z.array(detalleComprobanteSchema).min(1, "Debe haber al menos un producto"),
  formasPago: z.array(formaPagoSchema).min(1, "Debe haber al menos una forma de pago"),
});

// POST: Crear comprobante (venta)
export async function POST(req: NextRequest) {
  try {
    const { tenantId, error: authError } = await getAuthUser();

    if (authError) {
      return authError;
    }

    // Obtener usuario y empleado actual
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { AuthUserId: user.id, EstaEliminado: false },
      select: {
        Id: true,
        EmpleadoId: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = createComprobanteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const tenantIdBigInt = BigInt(tenantId);
    const usuarioId = usuario.Id;
    const empleadoId = usuario.EmpleadoId;

    // Validar que el tipo de comprobante requiere puesto de trabajo
    if (
      data.tipoComprobante === TIPO_COMPROBANTE.FACTURA &&
      !data.puestoTrabajoId
    ) {
      return NextResponse.json(
        { error: "Puesto de trabajo es requerido para facturas" },
        { status: 400 }
      );
    }

    // Si clienteId es null o undefined, usar 0 para Consumidor Final
    if (data.clienteId === null || data.clienteId === undefined) {
      data.clienteId = 0;
    }

    // Preparar clienteIdFinal (se resolverá en la transacción si es Consumidor Final)
    let clienteIdFinal = data.clienteId || 0;

    // Validar puesto de trabajo si es factura
    if (data.puestoTrabajoId) {
      const puesto = await prisma.puestoTrabajo.findFirst({
        where: {
          Id: BigInt(data.puestoTrabajoId),
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
        },
      });

      if (!puesto) {
        return NextResponse.json(
          { error: "Puesto de trabajo no encontrado" },
          { status: 404 }
        );
      }
    }

    // Validar artículos y stock
    const articulosIds = data.detalles.map((d) => BigInt(d.articuloId));
    const articulos = await prisma.articulo.findMany({
      where: {
        Id: { in: articulosIds },
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      include: {
        Stock: {
          where: {
            EstaEliminado: false,
          },
        },
        Iva: true,
      },
    });

    if (articulos.length !== data.detalles.length) {
      return NextResponse.json(
        { error: "Uno o más productos no fueron encontrados" },
        { status: 404 }
      );
    }

    // Validar stock si corresponde
    for (const detalle of data.detalles) {
      const articulo = articulos.find(
        (a) => Number(a.Id) === detalle.articuloId
      );
      if (!articulo) continue;

      if (articulo.DescuentaStock) {
        const stockTotal = articulo.Stock.reduce(
          (sum, s) => sum + Number(s.Cantidad),
          0
        );

        if (stockTotal < detalle.cantidad && !articulo.PermiteStockNegativo) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para ${articulo.Descripcion}. Stock disponible: ${stockTotal}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Obtener configuración para saber si descuenta stock
    const configuracion = await prisma.configuracion.findFirst({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
    });

    const descuentaStock =
      (data.tipoComprobante === TIPO_COMPROBANTE.FACTURA &&
        configuracion?.FacturaDescuentaStock) ||
      (data.tipoComprobante === TIPO_COMPROBANTE.PRESUPUESTO &&
        configuracion?.PresupuestoDescuentaStock) ||
      (data.tipoComprobante === TIPO_COMPROBANTE.REMITO &&
        configuracion?.RemitoDescuentaStock) ||
      false;

    // Obtener próximo número de comprobante
    const numeroResponse = await fetch(
      `${req.nextUrl.origin}/api/contadores?tipoComprobante=${data.tipoComprobante}`,
      {
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
      }
    );

    if (!numeroResponse.ok) {
      return NextResponse.json(
        { error: "Error al obtener número de comprobante" },
        { status: 500 }
      );
    }

    const { numero } = await numeroResponse.json();

    // Calcular totales
    const subtotal = data.detalles.reduce(
      (sum, d) => sum + d.subtotal,
      0
    );
    const descuento = data.descuento || 0;
    const subtotalConDescuento = subtotal - descuento;

    // Calcular IVA (21% y 10.5%)
    let iva21 = 0;
    let iva105 = 0;

    for (const detalle of data.detalles) {
      const articulo = articulos.find(
        (a) => Number(a.Id) === detalle.articuloId
      );
      if (!articulo) continue;

      const porcentajeIva = Number(articulo.Iva.Porcentaje);
      const baseImponible = detalle.subtotal * (1 - descuento / subtotal);

      if (porcentajeIva === 21) {
        iva21 += (baseImponible * 21) / 121;
      } else if (porcentajeIva === 10.5) {
        iva105 += (baseImponible * 10.5) / 110.5;
      }
    }

    const total = subtotalConDescuento;

    // Validar que las formas de pago sumen el total
    const totalFormasPago = data.formasPago.reduce(
      (sum, fp) => sum + fp.monto,
      0
    );

    if (Math.abs(totalFormasPago - total) > 0.01) {
      return NextResponse.json(
        {
          error: `El total de formas de pago (${totalFormasPago}) no coincide con el total de la venta (${total})`,
        },
        { status: 400 }
      );
    }

    // Crear comprobante y todas sus relaciones en una transacción
    const fecha = data.fecha ? new Date(data.fecha) : new Date();

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear Comprobante
      const comprobante = await tx.comprobante.create({
        data: {
          TenantId: tenantIdBigInt,
          EmpleadoId: empleadoId,
          UsuarioId: usuarioId,
          Fecha: fecha,
          Numero: numero,
          SubTotal: subtotal,
          Descuento: descuento,
          Total: total,
          Iva21: iva21,
          Iva105: iva105,
          TipoComprobante: data.tipoComprobante,
          EstaEliminado: false,
        },
      });

      // 2. Crear DetalleComprobante
      for (const detalle of data.detalles) {
        const articulo = articulos.find(
          (a) => Number(a.Id) === detalle.articuloId
        );
        if (!articulo) continue;

        await tx.detalleComprobante.create({
          data: {
            TenantId: tenantIdBigInt,
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

        // 3. Actualizar stock si corresponde
        if (descuentaStock && articulo.DescuentaStock) {
          const stock = articulo.Stock[0];
          if (stock) {
            await tx.stock.update({
              where: { Id: stock.Id },
              data: {
                Cantidad: {
                  decrement: detalle.cantidad,
                },
              },
            });
          } else {
            // Si no hay stock, crear uno negativo
            await tx.stock.create({
              data: {
                TenantId: tenantIdBigInt,
                ArticuloId: BigInt(detalle.articuloId),
                Cantidad: -detalle.cantidad,
                EstaEliminado: false,
              },
            });
          }
        }
      }

      // 4. Crear FormaPago y sus relaciones
      for (const formaPago of data.formasPago) {
        const formaPagoCreada = await tx.formaPago.create({
          data: {
            TenantId: tenantIdBigInt,
            ComprobanteId: comprobante.Id,
            TipoPago: formaPago.tipoPago,
            Monto: formaPago.monto,
            EstaEliminado: false,
          },
        });

        // Crear relaciones específicas según tipo de pago
        if (formaPago.tipoPago === TIPO_PAGO.TARJETA && formaPago.tarjetaId) {
          await tx.formaPago_Tarjeta.create({
            data: {
              Id: formaPagoCreada.Id,
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
              Id: formaPagoCreada.Id,
              ClienteId: BigInt(formaPago.clienteId),
            },
          });
        } else if (
          formaPago.tipoPago === TIPO_PAGO.CHEQUE &&
          formaPago.chequeId
        ) {
          await tx.formaPago_Cheque.create({
            data: {
              Id: formaPagoCreada.Id,
              ChequeId: BigInt(formaPago.chequeId),
            },
          });
        }
      }

      // 5. Crear relación específica según tipo de comprobante
      if (data.tipoComprobante === TIPO_COMPROBANTE.FACTURA) {
        await tx.comprobante_Factura.create({
          data: {
            Id: comprobante.Id,
            ClienteId: BigInt(clienteIdFinalTx),
            PuestoTrabajoId: BigInt(data.puestoTrabajoId!),
            Estado: ESTADO_FACTURA.CONFIRMADO,
          },
        });
      } else if (data.tipoComprobante === TIPO_COMPROBANTE.PRESUPUESTO) {
        await tx.comprobante_Presupuesto.create({
          data: {
            Id: comprobante.Id,
            ClienteId: BigInt(clienteIdFinalTx),
          },
        });
      } else if (data.tipoComprobante === TIPO_COMPROBANTE.REMITO) {
        await tx.comprobante_Remito.create({
          data: {
            Id: comprobante.Id,
            ClienteId: BigInt(clienteIdFinalTx),
          },
        });
      }

      return comprobante;
    });

    return NextResponse.json(
      {
        comprobante: {
          id: Number(resultado.Id),
          numero: resultado.Numero,
          tipoComprobante: resultado.TipoComprobante,
          total: Number(resultado.Total),
          fecha: resultado.Fecha.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creando comprobante", error);
    return NextResponse.json(
      { error: "Error al crear comprobante", details: error.message },
      { status: 500 }
    );
  }
}

