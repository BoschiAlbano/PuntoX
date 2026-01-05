// API de localidades con filtro por departamento y búsqueda parcial.
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { serializeBigIntArray } from "@/utilities/serialization";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("q");
    const departamentoParam = req.nextUrl.searchParams.get("departamentoId");
    const departamentoId = departamentoParam ? Number(departamentoParam) : null;

    if (departamentoParam && !Number.isInteger(departamentoId)) {
      return NextResponse.json({ error: "Departamento invalido" }, { status: 400 });
    }

    const localidades = await prisma.localidad.findMany({
      where: {
        EstaEliminado: false,
        ...(departamentoId ? { DepartamentoId: BigInt(departamentoId) } : {}),
        ...(search
          ? { Descripcion: { contains: search, mode: "insensitive" } }
          : {}),
      },
      select: {
        Id: true,
        Descripcion: true,
        DepartamentoId: true,
        Departamento: {
          select: {
            Id: true,
            Descripcion: true,
            Provincia: {
              select: {
                Id: true,
                Descripcion: true,
              },
            },
          },
        },
      },
      orderBy: [{ Descripcion: "asc" }],
      take: 50,
    });

    const localidadesSerializadas = serializeBigIntArray(localidades);

    return NextResponse.json(localidadesSerializadas);
  } catch (error) {
    return handleError(error);
  }
}
