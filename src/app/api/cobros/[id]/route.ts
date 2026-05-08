import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import {
  ESTADO_FACTURA,
  TIPO_COMPROBANTE_VENTA,
  TIPO_PAGO,
  TIPO_MOVIMIENTO,
  SET_PERMISSIONS,
} from "@/lib/constants/comprobantes";

const formaPagoSchema = z.object({
  tipoPago: z.number().int().min(1).max(5),
  monto: z.number().positive(),
});

const cobrarSchema = z.object({
  formasPago: z.array(formaPagoSchema).min(1, "Debe ingresar al menos una forma de pago"),
  clienteId: z.number().int().positive().optional(), // Solo si se cambia Consumidor Final
  tipoComprobante: z
    .number()
    .int()
    .refine(
      (v) =>
        [
          TIPO_COMPROBANTE_VENTA.FACTURA_A,
          TIPO_COMPROBANTE_VENTA.FACTURA_B,
          TIPO_COMPROBANTE_VENTA.FACTURA_C,
          TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE,
        ].includes(v as any),
      "Tipo de comprobante inválido",
    )
    .optional(),
});

// POST /api/cobros/[id]
// Completa el cobro de un comprobante pendiente
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId, user } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.CAJA,
    });

    const { id } = await params;
    const comprobanteId = BigInt(id);
    const body = await req.json();
    const { formasPago, clienteId: nuevoClienteId, tipoComprobante: nuevoTipo } = cobrarSchema.parse(body);

    // Obtener usuario interno
    const usuario = await prisma.usuario.findFirst({
      where: { AuthUserId: user.id, EstaEliminado: false },
      select: { Id: true },
    });
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
    }

    // Obtener caja abierta del tenant (cualquier sucursal con caja abierta)
    const caja = await prisma.caja.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
        FechaCierre: null,
      },
    });
    if (!caja) {
      return NextResponse.json(
        { error: "No hay una caja abierta. Abrí la caja antes de cobrar." },
        { status: 400 },
      );
    }

    // Obtener el comprobante con su factura
    const comprobante = await prisma.comprobante.findFirst({
      where: {
        Id: comprobanteId,
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
        TipoComprobante: {
          in: [
            TIPO_COMPROBANTE_VENTA.FACTURA_A,
            TIPO_COMPROBANTE_VENTA.FACTURA_B,
            TIPO_COMPROBANTE_VENTA.FACTURA_C,
          ],
        },
      },
      include: {
        Comprobante_Factura: {
          include: {
            Persona_Cliente: {
              include: {
                Persona: {
                  select: { Id: true, Nombre: true, Apellido: true, Dni: true },
                },
              },
            },
          },
        },
        DetalleComprobante: {
          where: { EstaEliminado: false },
        },
      },
    });

    if (!comprobante) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 },
      );
    }

    const factura = comprobante.Comprobante_Factura;
    if (!factura || factura.Estado !== ESTADO_FACTURA.PENDIENTE) {
      return NextResponse.json(
        { error: "El comprobante no está en estado pendiente" },
        { status: 400 },
      );
    }

    // Validar que el total de formasPago coincide con el total del comprobante
    const totalPagado = formasPago.reduce((acc, p) => acc + p.monto, 0);
    const totalComprobante = Number(comprobante.Total);
    if (Math.abs(totalPagado - totalComprobante) > 0.01) {
      return NextResponse.json(
        {
          error: `El total pagado ($${totalPagado.toFixed(2)}) no coincide con el total del comprobante ($${totalComprobante.toFixed(2)})`,
        },
        { status: 400 },
      );
    }

    // Verificar límite de cuenta corriente si aplica
    // Si se cambia de cliente, validar contra el nuevo cliente
    const clienteActual = factura.Persona_Cliente;

    let clienteParaValidar = clienteActual;
    if (nuevoClienteId) {
      const nuevoPersonaCliente = await prisma.persona_Cliente.findFirst({
        where: { Id: BigInt(nuevoClienteId) },
        select: {
          ActivarCtaCte: true,
          TieneLimiteCompra: true,
          MontoMaximoCtaCte: true,
        },
      });
      clienteParaValidar = nuevoPersonaCliente as typeof clienteActual;
    }

    const clienteIdFinal = nuevoClienteId
      ? BigInt(nuevoClienteId)
      : factura.ClienteId;

    for (const fp of formasPago) {
      if (fp.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE) {
        if (!clienteParaValidar?.ActivarCtaCte) {
          return NextResponse.json(
            { error: "El cliente no tiene habilitada la cuenta corriente" },
            { status: 400 },
          );
        }
        if (clienteParaValidar?.TieneLimiteCompra) {
          const margen = Number(clienteParaValidar.MontoMaximoCtaCte ?? 0);
          if (fp.monto > margen) {
            return NextResponse.json(
              {
                error: `El monto excede el margen disponible del cliente ($${margen.toFixed(2)})`,
              },
              { status: 400 },
            );
          }
        }
      }
    }

    // Ejecutar en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Cambiar cliente si corresponde (solo desde Consumidor Final)
      if (nuevoClienteId) {
        const personaActual = factura.Persona_Cliente?.Persona;
        const esConsumidorFinal =
          personaActual?.Nombre === "Consumidor" &&
          personaActual?.Apellido === "Final";
        if (esConsumidorFinal) {
          await tx.comprobante_Factura.update({
            where: { Id: comprobanteId },
            data: { ClienteId: BigInt(nuevoClienteId) },
          });
        }
      }

      // Cambiar tipo de comprobante si se solicita
      if (nuevoTipo !== undefined) {
        await tx.comprobante.update({
          where: { Id: comprobanteId },
          data: { TipoComprobante: nuevoTipo },
        });
      }

      // Crear FormaPago records
      for (const fp of formasPago) {
        const formaPago = await tx.formaPago.create({
          data: {
            TenantId: BigInt(tenantId),
            ComprobanteId: comprobanteId,
            TipoPago: fp.tipoPago,
            Monto: fp.monto,
            EstaEliminado: false,
          },
        });

        if (fp.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE) {
          await tx.formaPago_CtaCte.create({
            data: {
              Id: formaPago.Id,
              ClienteId: clienteIdFinal,
            },
          });
        }
      }

      // Crear Movimiento
      await tx.movimiento.create({
        data: {
          CajaId: caja.Id,
          TenantId: BigInt(tenantId),
          UsuarioId: usuario.Id,
          ComprobanteId: comprobanteId,
          Monto: comprobante.Total,
          Fecha: new Date(),
          Descripcion: `Cobro diferido - Comp #${Number(comprobante.Numero)}`,
          TipoMovimiento: TIPO_MOVIMIENTO.ENTRADA,
          EstaEliminado: false,
          SucursalId: caja.SucursalId ?? undefined,
        },
      });

      // Actualizar Caja totales + DetalleCaja por forma de pago
      for (const fp of formasPago) {
        let fieldToUpdate: string | undefined;
        switch (fp.tipoPago) {
          case TIPO_PAGO.EFECTIVO:
            fieldToUpdate = "TotalEntradaEfectivo";
            break;
          case TIPO_PAGO.TARJETA:
            fieldToUpdate = "TotalEntradaTarjeta";
            break;
          case TIPO_PAGO.CHEQUE:
            fieldToUpdate = "TotalEntradaCheque";
            break;
          case TIPO_PAGO.CUENTA_CORRIENTE:
            fieldToUpdate = "TotalEntradaCtaCte";
            break;
          case TIPO_PAGO.TRANSFERENCIA:
            fieldToUpdate = "TotalEntradaTransf";
            break;
        }

        if (fieldToUpdate) {
          await tx.caja.update({
            where: { Id: caja.Id },
            data: { [fieldToUpdate]: { increment: fp.monto } },
          });
        }

        // Upsert DetalleCaja
        const existingDetalle = await tx.detalleCaja.findFirst({
          where: {
            CajaId: caja.Id,
            TipoPago: fp.tipoPago,
            TenantId: BigInt(tenantId),
            EstaEliminado: false,
          },
        });

        if (existingDetalle) {
          await tx.detalleCaja.update({
            where: { Id: existingDetalle.Id },
            data: { Monto: { increment: fp.monto } },
          });
        } else {
          await tx.detalleCaja.create({
            data: {
              CajaId: caja.Id,
              TipoPago: fp.tipoPago,
              TenantId: BigInt(tenantId),
              Monto: fp.monto,
              EstaEliminado: false,
            },
          });
        }
      }

      // Confirmar comprobante
      await tx.comprobante_Factura.update({
        where: { Id: comprobanteId },
        data: { Estado: ESTADO_FACTURA.CONFIRMADO },
      });

      // Preparar datos del ticket
      const detalles = comprobante.DetalleComprobante;
      const persona =
        factura.Persona_Cliente?.Persona;

      return {
        comprobanteId: Number(comprobanteId),
        numero: Number(comprobante.Numero),
        tipoComprobante: Number(comprobante.TipoComprobante),
        total: Number(comprobante.Total),
        fecha: comprobante.Fecha,
        cliente: persona
          ? {
              Id: Number(persona.Id),
              Nombre: persona.Nombre,
              Apellido: persona.Apellido,
              Dni: persona.Dni,
            }
          : null,
        detalles: detalles.map((d) => ({
          Id: Number(d.Id),
          Descripcion: d.Descripcion,
          Cantidad: Number(d.Cantidad),
          Precio: Number(d.Precio),
          SubTotal: Number(d.SubTotal),
          Iva: { Porcentaje: Number(d.Iva) },
          PrecioCosto: Number(d.Costo),
          subtotal: Number(d.SubTotal),
          cantidad: Number(d.Cantidad),
          precio: Number(d.Precio),
        })),
        formasPago: formasPago.map((p) => ({
          tipoPago: p.tipoPago,
          monto: p.monto,
        })),
        subtotal: Number(comprobante.SubTotal),
        descuento: Number(comprobante.Descuento),
      };
    });

    return NextResponse.json({ cobro: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Datos inválidos" },
        { status: 400 },
      );
    }
    return handleError(error);
  }
}
