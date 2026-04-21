import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";

const saveNotificacionesSchema = z.object({
  push: z.boolean(),
  resumenDiario: z.boolean(),
  stockBajo: z.boolean(),
});

export async function GET(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    permission: GET_PERMISSIONS.CONFIGURACION,
  });
  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const config = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      select: {
        NotificacionesPush: true,
        NotificacionesResumenDiario: true,
        NotificacionesStockBajo: true,
      },
      orderBy: {
        Id: "desc",
      },
    });

    if (!config) {
      return NextResponse.json(
        {
          notificaciones: {
            push: true,
            resumenDiario: false,
            stockBajo: true,
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        notificaciones: {
          push: config.NotificacionesPush ?? true,
          resumenDiario: config.NotificacionesResumenDiario ?? false,
          stockBajo: config.NotificacionesStockBajo ?? true,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    permission: SET_PERMISSIONS.CONFIGURACION,
  });
  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = saveNotificacionesSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const config = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      select: { Id: true },
      orderBy: {
        Id: "desc",
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuracion no encontrada" },
        { status: 404 },
      );
    }

    const updated = await prisma.configuracion.update({
      where: { Id: config.Id, TenantId: BigInt(tenantId) },
      data: {
        NotificacionesPush: data.push,
        NotificacionesResumenDiario: data.resumenDiario,
        NotificacionesStockBajo: data.stockBajo,
      },
      select: {
        NotificacionesPush: true,
        NotificacionesResumenDiario: true,
        NotificacionesStockBajo: true,
      },
    });

    return NextResponse.json(
      {
        notificaciones: {
          push: updated.NotificacionesPush,
          resumenDiario: updated.NotificacionesResumenDiario,
          stockBajo: updated.NotificacionesStockBajo,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
