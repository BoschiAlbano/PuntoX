import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";

// GET: Listar puestos de trabajo
export async function GET(_req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const puestos = await prisma.puestoTrabajo.findMany({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      orderBy: {
        Codigo: "asc",
      },
    });

    const response = puestos.map((puesto) => ({
      id: Number(puesto.Id),
      codigo: puesto.Codigo,
      descripcion: puesto.Descripcion,
    }));

    return NextResponse.json({ puestos: response }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener puestos de trabajo", error);
    return NextResponse.json(
      { error: "Error al obtener puestos de trabajo" },
      { status: 500 }
    );
  }
}

