import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";

// GET /api/marcas - Listar todas las marcas activas
export async function GET(request: NextRequest) {
  try {
    const marcas = await prisma.marca.findMany({
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

    return NextResponse.json(marcas, { status: 200 });
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    return NextResponse.json(
      { error: "Error al obtener marcas" },
      { status: 500 }
    );
  }
}
