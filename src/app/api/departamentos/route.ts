// API de departamentos, filtrados por provincia y búsqueda parcial.
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { serializeBigIntArray } from "@/utilities/serialization";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    const provinciaParam = req.nextUrl.searchParams.get("provinciaId");
    const search = req.nextUrl.searchParams.get("q");
    const provinciaId = provinciaParam ? Number(provinciaParam) : null;

    if (provinciaParam && !Number.isInteger(provinciaId)) {
      return NextResponse.json({ error: "Provincia invalida" }, { status: 400 });
    }

    const departamentos = await prisma.departamento.findMany({
      where: {
        EstaEliminado: false,
        ...(provinciaId ? { ProvinciaId: BigInt(provinciaId) } : {}),
        ...(search
          ? { Descripcion: { contains: search, mode: "insensitive" } }
          : {}),
      },
      select: { Id: true, Descripcion: true, ProvinciaId: true },
      orderBy: [{ Descripcion: "asc" }],
      take: 50,
    });

    return NextResponse.json(serializeBigIntArray(departamentos));
  } catch (error) {
    return handleError(error);
  }
}
