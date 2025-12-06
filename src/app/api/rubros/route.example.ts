import { NextResponse } from "next/server";
import prisma from "@/DB/prisma";

// GET /api/rubros - Listar todos los rubros activos
export async function GET() {
  try {
    const rubros = await prisma.rubro.findMany({
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

    return NextResponse.json(rubros, { status: 200 });
  } catch (error) {
    console.error("Error al obtener rubros:", error);
    return NextResponse.json(
      { error: "Error al obtener rubros" },
      { status: 500 }
    );
  }
}
