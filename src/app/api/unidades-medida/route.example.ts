import { NextResponse } from "next/server";
import prisma from "@/DB/prisma";

// GET /api/unidades-medida - Listar todas las unidades de medida activas
export async function GET() {
  try {
    const unidades = await prisma.unidadMedida.findMany({
      where: {
        EstaEliminado: false,
      },
      select: {
        Id: true,
        Descripcion: true,
      },
      orderBy: {
        Descripcion: "asc",
      },
    });

    return NextResponse.json(unidades, { status: 200 });
  } catch (error) {
    console.error("Error al obtener unidades de medida:", error);
    return NextResponse.json(
      { error: "Error al obtener unidades de medida" },
      { status: 500 }
    );
  }
}
