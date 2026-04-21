import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PRODUCTOS, // Requires products permission
    });

    const ultimoProducto = await prisma.articulo.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        // We look at all products including deleted ones to avoid code collision
        // if unique codes are desired, or just to keep the sequence monotonic.
      },
      orderBy: {
        Codigo: "desc",
      },
      select: {
        Codigo: true,
      },
    });

    const nuevoCodigo = (ultimoProducto?.Codigo || 0) + 1;

    return NextResponse.json({ ultimoCodigo: nuevoCodigo }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
