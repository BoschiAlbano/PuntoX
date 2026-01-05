// API de provincias (catálogo) con búsqueda opcional.
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { serializeBigIntArray } from "@/utilities/serialization";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("q");

    const provincias = await prisma.provincia.findMany({
      where: {
        EstaEliminado: false,
        ...(search
          ? { Descripcion: { contains: search, mode: "insensitive" } }
          : {}),
      },
      select: { Id: true, Descripcion: true },
      orderBy: [{ Descripcion: "asc" }],
      take: 50,
    });

    return NextResponse.json(serializeBigIntArray(provincias));
  } catch (error) {
    return handleError(error);
  }
}
