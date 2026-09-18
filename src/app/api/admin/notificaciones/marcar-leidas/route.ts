import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";

export async function POST(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await req.json();
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

    if (id) {
      await prisma.notificacion.updateMany({
        where: {
          Id: BigInt(id),
          TenantId: superAdminProfile.TenantId,
        },
        data: {
          Leida: true,
        },
      });
    } else {
      // Marcar todas como leídas
      await prisma.notificacion.updateMany({
        where: {
          TenantId: superAdminProfile.TenantId,
          Leida: false,
        },
        data: {
          Leida: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
