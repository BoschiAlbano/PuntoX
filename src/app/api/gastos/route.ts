import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";
import { handleError } from "@/lib/errors/handler";
import { PERMISSIONS, SET_PERMISSIONS, GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";

export const createGastoSchema = z.object({
  conceptoGastoId: z.number(),
  descripcion: z.string().min(1, "La descripción es requerida"),
  pagos: z
    .array(
      z.object({
        tipoPago: z.number(),
        monto: z
          .number()
          .min(0.01)
          .max(999_999_999_999, "El monto de pago no puede exceder el límite"),
      }),
    )
    .min(1, "Debe agregar al menos un pago"),
});

export async function POST(req: NextRequest) {
  try {
    const { tenantId, user } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.CAJA,
    });

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { AuthUserId: user.id, EstaEliminado: false },
      select: { Id: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 },
      );
    }

    const sucursalIdParam = req.nextUrl.searchParams.get("sucursalId");

    let sucursalId: bigint | null = null;

    if (sucursalIdParam) {
      const access = await verifyUserBranchAccess(
        BigInt(tenantId),
        user.id,
        sucursalIdParam,
      );
      if (access) {
        sucursalId = access.sucursal.Id;
      }
    }

    // Verificar si hay una caja abierta para este usuario/sucursal/tenant
    // Nota: Un gasto generalmente se asocia a una caja.
    const cajaAbierta = await prisma.caja.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        SucursalId: sucursalId,
        UsuarioAperturaId: usuario.Id,
        EstaEliminado: false,
        FechaCierre: null,
      },
    });

    if (!cajaAbierta) {
      return NextResponse.json(
        { error: "No tienes una caja abierta en esta sucursal" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const data = createGastoSchema.parse(body);

    // Calcular monto total
    const montoTotal = data.pagos.reduce((acc, p) => acc + p.monto, 0);

    // Verificar concepto
    const concepto = await prisma.conceptoGastos.findFirst({
      where: {
        Id: BigInt(data.conceptoGastoId),
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
    });

    if (!concepto) {
      return NextResponse.json(
        { error: "Concepto de gasto no encontrado" },
        { status: 404 },
      );
    }

    // Transacción para consistencia
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear Gasto
      const nuevoGasto = await tx.gasto.create({
        data: {
          TenantId: BigInt(tenantId),
          SucursalId: sucursalId,
          CajaId: cajaAbierta.Id,
          ConceptoGastoId: BigInt(data.conceptoGastoId),
          Fecha: new Date(),
          Descripcion: data.descripcion,
          Monto: montoTotal,
          EstaEliminado: false,
        },
      });

      // 2. Crear Formas de Pago asociadas al Gasto
      await tx.formaPago.createMany({
        data: data.pagos.map((p) => ({
          TenantId: BigInt(tenantId),
          GastoId: nuevoGasto.Id,
          TipoPago: p.tipoPago,
          Monto: p.monto,
          EstaEliminado: false,
        })),
      });

      // 3. Actualizar totales de la CAJA (Salidas)
      const updates: any = {};

      data.pagos.forEach((p) => {
        if (p.tipoPago === TIPO_PAGO.EFECTIVO) {
          updates.TotalSalidaEfectivo = { increment: p.monto };
        } else if (p.tipoPago === TIPO_PAGO.TARJETA) {
          updates.TotalSalidaTarjeta = { increment: p.monto };
        } else if (p.tipoPago === TIPO_PAGO.CHEQUE) {
          updates.TotalSalidaCheque = { increment: p.monto };
        } else if (p.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE) {
          updates.TotalSalidaCtaCte = { increment: p.monto };
        } else if (p.tipoPago === TIPO_PAGO.TRANSFERENCIA) {
          updates.TotalSalidaTransf = { increment: p.monto };
        }
      });

      if (Object.keys(updates).length > 0) {
        await tx.caja.update({
          where: { Id: cajaAbierta.Id },
          data: updates,
        });
      }

      return nuevoGasto;
    });

    return NextResponse.json({
      gasto: {
        ...result,
        Id: Number(result.Id),
        CajaId: Number(result.CajaId),
        ConceptoGastoId: Number(result.ConceptoGastoId),
        TenantId: Number(result.TenantId),
      },
    });
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

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId, user } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.CAJA,
    });

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const gastoId = searchParams.get("id");

    if (!gastoId) {
      return NextResponse.json(
        { error: "ID del gasto es requerido" },
        { status: 400 },
      );
    }

    // Buscar el gasto y sus pagos para poder restar los totales
    const gasto = await prisma.gasto.findFirst({
      where: {
        Id: BigInt(gastoId),
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      include: {
        FormaPago: {
          where: { EstaEliminado: false },
        },
        Caja: true, // Para verificar estado de la caja si es necesario
      },
    });

    if (!gasto) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 },
      );
    }

    // Opcional: Validar si la caja está cerrada.
    // Si la caja ya está cerrada, quizás no deberíamos permitir eliminar el gasto
    // porque alteraría los totales de un cierre pasado.
    if (gasto.Caja.FechaCierre) {
      return NextResponse.json(
        { error: "No se puede eliminar un gasto de una caja cerrada" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Revertir totales de la CAJA -> RESTAR lo que se había sumado a salida
      // Como estamos eliminando el gasto, la "Salida" disminuye, por lo tanto "decrement".
      const updates: any = {};

      gasto.FormaPago.forEach((p) => {
        const monto = Number(p.Monto);
        if (p.TipoPago === TIPO_PAGO.EFECTIVO) {
          updates.TotalSalidaEfectivo = { decrement: monto };
        } else if (p.TipoPago === TIPO_PAGO.TARJETA) {
          updates.TotalSalidaTarjeta = { decrement: monto };
        } else if (p.TipoPago === TIPO_PAGO.CHEQUE) {
          updates.TotalSalidaCheque = { decrement: monto };
        } else if (p.TipoPago === TIPO_PAGO.CUENTA_CORRIENTE) {
          updates.TotalSalidaCtaCte = { decrement: monto };
        } else if (p.TipoPago === TIPO_PAGO.TRANSFERENCIA) {
          updates.TotalSalidaTransf = { decrement: monto };
        }
      });

      if (Object.keys(updates).length > 0) {
        await tx.caja.update({
          where: { Id: gasto.CajaId },
          data: updates,
        });
      }

      // 2. Soft Delete FormaPago
      await tx.formaPago.updateMany({
        where: { GastoId: gasto.Id },
        data: { EstaEliminado: true },
      });

      // 3. Soft Delete Gasto
      await tx.gasto.update({
        where: { Id: gasto.Id },
        data: { EstaEliminado: true },
      });
    });

    return NextResponse.json({ message: "Gasto eliminado correctamente" });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { tenantId, user } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.CAJA,
    });

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const gastoId = searchParams.get("id");

    if (!gastoId) {
      return NextResponse.json(
        { error: "ID del gasto es requerido" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const data = createGastoSchema.parse(body); // Reusing create schema as structure is same

    // Buscar el gasto existente
    const gastoExistente = await prisma.gasto.findFirst({
      where: {
        Id: BigInt(gastoId),
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      include: {
        FormaPago: {
          where: { EstaEliminado: false },
        },
        Caja: true,
      },
    });

    if (!gastoExistente) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 },
      );
    }

    if (gastoExistente.Caja.FechaCierre) {
      return NextResponse.json(
        { error: "No se puede modificar un gasto de una caja cerrada" },
        { status: 400 },
      );
    }

    const montoTotal = data.pagos.reduce((acc, p) => acc + p.monto, 0);

    // Verificar concepto
    const concepto = await prisma.conceptoGastos.findFirst({
      where: {
        Id: BigInt(data.conceptoGastoId),
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
    });

    if (!concepto) {
      return NextResponse.json(
        { error: "Concepto de gasto no encontrado" },
        { status: 404 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Revertir impacto de pagos ANTERIORES en la caja (Restar lo sumado)
      // Como eran salidas, "revertir" significa DECREMENTAR la salida.
      const reverseUpdates: any = {};
      gastoExistente.FormaPago.forEach((p) => {
        const monto = Number(p.Monto);
        if (p.TipoPago === TIPO_PAGO.EFECTIVO) {
          reverseUpdates.TotalSalidaEfectivo = { decrement: monto };
        } else if (p.TipoPago === TIPO_PAGO.TARJETA) {
          reverseUpdates.TotalSalidaTarjeta = { decrement: monto };
        } else if (p.TipoPago === TIPO_PAGO.CHEQUE) {
          reverseUpdates.TotalSalidaCheque = { decrement: monto };
        } else if (p.TipoPago === TIPO_PAGO.CUENTA_CORRIENTE) {
          reverseUpdates.TotalSalidaCtaCte = { decrement: monto };
        } else if (p.TipoPago === TIPO_PAGO.TRANSFERENCIA) {
          reverseUpdates.TotalSalidaTransf = { decrement: monto };
        }
      });

      if (Object.keys(reverseUpdates).length > 0) {
        await tx.caja.update({
          where: { Id: gastoExistente.CajaId },
          data: reverseUpdates,
        });
      }

      // 2. Eliminar (soft delete) las formas de pago anteriores
      await tx.formaPago.updateMany({
        where: { GastoId: gastoExistente.Id },
        data: { EstaEliminado: true },
      });

      // 3. Actualizar datos del Gasto principal
      const gastoActualizado = await tx.gasto.update({
        where: { Id: gastoExistente.Id },
        data: {
          ConceptoGastoId: BigInt(data.conceptoGastoId),
          Descripcion: data.descripcion,
          Monto: montoTotal,
          // Fecha: new Date(), // Opcional: ¿Actualizamos la fecha al editar? Generalmente mejor mantener la original o tener FechaModificacion. Mantengamos original por ahora.
        },
      });

      // 4. Crear NUEVAS Formas de Pago
      await tx.formaPago.createMany({
        data: data.pagos.map((p) => ({
          TenantId: BigInt(tenantId),
          GastoId: gastoActualizado.Id,
          TipoPago: p.tipoPago,
          Monto: p.monto,
          EstaEliminado: false,
        })),
      });

      // 5. Aplicar impacto de NUEVOS pagos en la caja (Sumar a salida)
      const forwardUpdates: any = {};
      data.pagos.forEach((p) => {
        if (p.tipoPago === TIPO_PAGO.EFECTIVO) {
          forwardUpdates.TotalSalidaEfectivo = { increment: p.monto };
        } else if (p.tipoPago === TIPO_PAGO.TARJETA) {
          forwardUpdates.TotalSalidaTarjeta = { increment: p.monto };
        } else if (p.tipoPago === TIPO_PAGO.CHEQUE) {
          forwardUpdates.TotalSalidaCheque = { increment: p.monto };
        } else if (p.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE) {
          forwardUpdates.TotalSalidaCtaCte = { increment: p.monto };
        } else if (p.tipoPago === TIPO_PAGO.TRANSFERENCIA) {
          forwardUpdates.TotalSalidaTransf = { increment: p.monto };
        }
      });

      if (Object.keys(forwardUpdates).length > 0) {
        await tx.caja.update({
          where: { Id: gastoExistente.CajaId }, // La caja no cambia
          data: forwardUpdates,
        });
      }

      return gastoActualizado;
    });

    return NextResponse.json({
      gasto: {
        ...result,
        Id: Number(result.Id),
        CajaId: Number(result.CajaId),
        ConceptoGastoId: Number(result.ConceptoGastoId),
        TenantId: Number(result.TenantId),
      },
      message: "Gasto actualizado correctamente",
    });
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
