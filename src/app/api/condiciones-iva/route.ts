import { NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";

// Condiciones IVA comunes en Argentina
const CONDICIONES_IVA_DEFAULT = [
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
  "No Responsable",
  "Consumidor Final",
];

async function inicializarCondicionesIva() {
  try {
    // Verificar si ya existen condiciones IVA
    const count = await prisma.condicionIva.count({
      where: { EstaEliminado: false },
    });

    if (count === 0) {
      // Crear condiciones IVA por defecto
      await prisma.$transaction(
        CONDICIONES_IVA_DEFAULT.map((descripcion) =>
          prisma.condicionIva.upsert({
            where: { Descripcion: descripcion },
            create: {
              Descripcion: descripcion,
              EstaEliminado: false,
            },
            update: {
              EstaEliminado: false,
            },
          })
        )
      );
    }
  } catch (error) {
    console.error("Error inicializando condiciones IVA:", error);
    // No lanzamos error, solo logueamos para no romper el flujo
  }
}

export async function GET() {
  try {
    const { error } = await getAuthUser();

    if (error) {
      return error;
    }

    // Inicializar condiciones IVA si no existen
    await inicializarCondicionesIva();

    const condicionesIva = await prisma.condicionIva.findMany({
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

    return NextResponse.json(
      {
        condicionesIva: condicionesIva.map((cond) => ({
          id: Number(cond.Id),
          descripcion: cond.Descripcion,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener condiciones IVA", error);
    return NextResponse.json(
      { error: "Error al obtener condiciones IVA" },
      { status: 500 }
    );
  }
}

