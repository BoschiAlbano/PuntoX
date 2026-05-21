import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";
import { puntosVentaBulkSchema } from "@/lib/validations/facturacion.schema";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({ req });
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sucursales = await prisma.sucursal.findMany({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
        EstaActiva: true,
      },
      select: {
        Id: true,
        Nombre: true,
        PuntoVentaAfip: true,
        DomicilioFiscal: true,
      },
      orderBy: { Nombre: "asc" },
    });

    return NextResponse.json(
      {
        puntosVenta: sucursales.map((s) => ({
          sucursalId: Number(s.Id),
          nombre: s.Nombre,
          puntoVentaAfip: s.PuntoVentaAfip,
          domicilioFiscal: s.DomicilioFiscal || "",
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({ req });
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const result = puntosVentaBulkSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: result.error.issues },
        { status: 400 }
      );
    }

    const { puntosVenta } = result.data;

    // Actualizar cada sucursal en una transacción
    await prisma.$transaction(
      puntosVenta.map((pv) =>
        prisma.sucursal.updateMany({
          where: {
            Id: BigInt(pv.sucursalId),
            TenantId: BigInt(tenantId),
            EstaEliminado: false,
          },
          data: {
            PuntoVentaAfip: pv.puntoVentaAfip,
            DomicilioFiscal: pv.domicilioFiscal || null,
          },
        })
      )
    );

    return NextResponse.json(
      { message: "Puntos de venta actualizados correctamente" },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
