import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const superAdminProfile = await prisma.perfiles.findFirst({
      where: {
        Tipo: "SUPERADMIN" as any,
        EstaEliminado: false,
      },
      select: { TenantId: true },
    });

    if (!superAdminProfile) {
      return NextResponse.json(
        { error: "No se encontró un perfil SuperAdmin" },
        { status: 404 },
      );
    }

    const notificaciones = await prisma.notificacion.findMany({
      where: {
        TenantId: superAdminProfile.TenantId,
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
