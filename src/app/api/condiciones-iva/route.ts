import { NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";

// Condiciones de IVA estándar de Argentina
const CONDICIONES_IVA_DEFAULT = [
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
  "No Responsable",
  "Consumidor Final",
];

export async function GET() {
  try {
    let condiciones = await prisma.condicionIva.findMany({
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

    // Si no hay condiciones, crear las básicas
    if (condiciones.length === 0) {
      for (const descripcion of CONDICIONES_IVA_DEFAULT) {
        await prisma.condicionIva.create({
          data: {
            Descripcion: descripcion,
            EstaEliminado: false,
          },
        });
      }

      // Volver a consultar
      condiciones = await prisma.condicionIva.findMany({
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
    }

    return NextResponse.json(
      condiciones.map((c) => ({
        id: Number(c.Id),
        descripcion: c.Descripcion,
      })),
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
