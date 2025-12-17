import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";

// GET: Listar tarjetas configuradas
export async function GET(_req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const tarjetas = await prisma.tarjeta.findMany({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      orderBy: {
        Descripcion: "asc",
      },
    });

    const response = tarjetas.map((tarjeta) => ({
      id: Number(tarjeta.Id),
      descripcion: tarjeta.Descripcion,
    }));

    return NextResponse.json({ tarjetas: response }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}


