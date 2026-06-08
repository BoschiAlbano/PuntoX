import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";

export async function POST(req: NextRequest) {
  try {
    const { isSuperAdmin, tenantId } = await getAuthContext({ req });

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await req.json();

    if (id) {
      await prisma.notificacion.updateMany({
        where: {
          Id: BigInt(id),
          TenantId: BigInt(tenantId),
        },
        data: {
          Leida: true,
        },
      });
    } else {
      // Marcar todas como leídas
      await prisma.notificacion.updateMany({
        where: {
          TenantId: BigInt(tenantId),
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
