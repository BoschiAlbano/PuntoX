import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import {
  estadoSuscripcion,
  suscripcionBloqueada,
  ultimoDiaDeGracia,
} from "@/lib/suscripcion/vencimiento";

/**
 * GET /api/suscripcion/estado
 * Estado de la suscripción del comercio del usuario. Es de lo poco que
 * responde con la suscripción bloqueada: lo usa /suscripcion-vencida.
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId, isSuperAdmin } = await getAuthContext({
      req,
      permitirSuscripcionBloqueada: true,
    });

    const tenant = await prisma.tenant.findUnique({
      where: { Id: BigInt(tenantId) },
      select: { Nombre: true, EstaActivo: true, FechaVencimiento: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
    }

    const estado = estadoSuscripcion(tenant);
    return NextResponse.json({
      comercio: tenant.Nombre,
      estado,
      bloqueada: !isSuperAdmin && suscripcionBloqueada(estado),
      fechaVencimiento: tenant.FechaVencimiento?.toISOString() ?? null,
      ultimoDiaDeGracia: tenant.FechaVencimiento
        ? ultimoDiaDeGracia(tenant.FechaVencimiento).toISOString()
        : null,
    });
  } catch (error) {
    return handleError(error);
  }
}
