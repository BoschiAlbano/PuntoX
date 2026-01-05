import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import {
  createMarcaSchema,
  updateMarcaSchema,
} from "@/lib/validations/marca.schema";
import { ZodError } from "zod";

import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { createError } from "@/lib/errors/types";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  // Obtener la session del usuario
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }

  try {
    const pagination = parsePaginationParams(req);
    const search = req.nextUrl.searchParams.get("q")?.trim() || "";

    const where: any = {
      TenantId: tenantId,
    };

    if (search) {
      where.Descripcion = { contains: search, mode: "insensitive" };
    }

    // 1. Obtener Total
    const total = await prisma.marca.count({ where });

    // 2. Obtener Datos Paginados
    const marcas = await prisma.marca.findMany({
      where,
      select: {
        Id: true,
        Descripcion: true,
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
    const response = createPaginationResponse(marcas, total, pagination);

    // Ajustamos la respuesta para que cumpla con { data: [], meta: ... } si quisiéramos ser estrictos
    // Pero el helper devuelve { data, pagination }, y nuestro hook GenericCrud lee 'pagination' también, así que está bien.

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleError(error);
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
    const validatedData = createMarcaSchema.parse(body);

    // Crear la marca con datos validados
    const marca = await prisma.marca.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: tenantId,
      },
    });

    return NextResponse.json(
      {
        ...marca,
        Id: Number(marca.Id),
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

    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }
  const idParam =
    req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
  const marcaId = idParam ? Number(idParam) : NaN;

  if (!Number.isInteger(marcaId)) {
    return NextResponse.json(
      { error: "Id de marca invalido" },
      { status: 400 }
    );
  }

  try {
    const marcaActualizada = await prisma.marca.delete({
      where: {
        Id: marcaId,
        TenantId: tenantId,
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(marcaActualizada.Id) },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 }
      );
    }

    return handleError(error);
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
    const validatedData = updateMarcaSchema.parse(body);

    const tenantIdBigInt = BigInt(tenantId);

    // Crear la marca con datos validados
    const marca = await prisma.marca.update({
      where: {
        Id: BigInt(validatedData.Id),
        TenantId: tenantIdBigInt,
      },
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
      },
    });

    return NextResponse.json(
      {
        ...marca,
        Id: Number(marca.Id),
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

    return handleError(error);
  }
}
