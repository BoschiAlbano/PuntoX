import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { createIvaSchema, updateIvaSchema } from "@/lib/validations/iva.schema";
import { ZodError } from "zod";

import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { createError } from "@/lib/errors/types";

export async function GET(req: NextRequest) {
  // Obtener la session del usuario
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }

  try {
    const pagination = parsePaginationParams(req);
    const search = req.nextUrl.searchParams.get("q")?.trim() || "";

    const where: any = {};

    if (search) {
      where.Descripcion = { contains: search, mode: "insensitive" };
    }

    // 1. Obtener Total
    const total = await prisma.iva.count({ where });

    // 2. Obtener Datos Paginados
    const ivas = await prisma.iva.findMany({
      where,
      select: {
        Id: true,
        Descripcion: true,
        Porcentaje: true,
        EstaEliminado: true,
      },
      orderBy: {
        Descripcion: "asc",
      },
      skip: pagination.skip,
      take: pagination.limit,
    });

    // 3. Formatear Respuesta
    // const data = marcas.map((marca) => ({ ...marca, Id: Number(marca.Id) }));
    const response = createPaginationResponse(ivas, total, pagination);

    // Ajustamos la respuesta para que cumpla con { data: [], meta: ... } si quisiéramos ser estrictos
    // Pero el helper devuelve { data, pagination }, y nuestro hook GenericCrud lee 'pagination' también, así que está bien.

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener ivas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }

  try {
    const body = await req.json();

    // Validar el body con Zod
    const validatedData = createIvaSchema.parse(body);

    // Crear la marca con datos validados
    const iva = await prisma.iva.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        Porcentaje: validatedData.Porcentaje,
      },
    });

    return NextResponse.json(
      {
        ...iva,
        Id: Number(iva.Id),
        TenantId: tenantId,
      },
      { status: 201 }
    );
  } catch (error) {
    // Manejo de errores de validación de Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear marca" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }
  const idParam =
    req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
  const ivaId = idParam ? Number(idParam) : NaN;

  console.log("Iva ID:", ivaId);

  if (!Number.isInteger(ivaId)) {
    return NextResponse.json({ error: "Id de iva invalido" }, { status: 400 });
  }

  try {
    const ivaActualizada = await prisma.iva.delete({
      where: {
        Id: ivaId,
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(ivaActualizada.Id) },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json({ error: "Iva no encontrada" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Error al eliminar iva" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    if (!tenantId || tenantId <= 0) {
      throw createError.unauthorized("TenantId inválido o no proporcionado");
    }

    const body = await req.json();

    // Validar el body con Zod
    const validatedData = updateIvaSchema.parse(body);

    // Crear la marca con datos validados
    const iva = await prisma.iva.update({
      where: {
        Id: BigInt(validatedData.Id),
      },
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        Porcentaje: validatedData.Porcentaje,
      },
    });

    return NextResponse.json(
      {
        ...iva,
        Id: Number(iva.Id),
        TenantId: tenantId,
      },
      { status: 201 }
    );
  } catch (error) {
    // Manejo de errores de validación de Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar iva" },
      { status: 500 }
    );
  }
}
