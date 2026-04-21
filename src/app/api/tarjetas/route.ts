import { NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";

// GET: Listar tarjetas configuradas
export async function GET() {
  try {
    const { tenantId } = await getAuthContext();

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
