import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    const { isSuperAdmin, tenantId } = await getAuthContext({ req });

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener notificaciones no leídas para el TenantId actual
    const notificaciones = await prisma.notificacion.findMany({
      where: {
        TenantId: BigInt(tenantId),
        Leida: false,
      },
      orderBy: {
        Fecha: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      data: notificaciones.map((n) => ({
        id: Number(n.Id),
        tipo: n.Tipo,
        titulo: n.Titulo,
        mensaje: n.Mensaje,
        fecha: n.Fecha.toISOString(),
        accionUrl: n.AccionUrl,
      })),
      unreadCount: notificaciones.length,
    });
  } catch (error) {
    return handleError(error);
  }
}
