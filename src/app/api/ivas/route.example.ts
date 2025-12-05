import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";

// GET /api/ivas - Listar todos los tipos de IVA activos
export async function GET(request: NextRequest) {
  try {
    const ivas = await prisma.iva.findMany({
      where: {
        EstaEliminado: false,
      },
      select: {
        Id: true,
        Descripcion: true,
        Porcentaje: true,
      },
      orderBy: {
        Porcentaje: "desc",
      },
    });

    return NextResponse.json(ivas, { status: 200 });
  } catch (error) {
    console.error("Error al obtener tipos de IVA:", error);
    return NextResponse.json(
      { error: "Error al obtener tipos de IVA" },
      { status: 500 }
    );
  }
}
