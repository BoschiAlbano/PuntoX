import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";
import {
  createMarcaSchema,
  updateMarcaSchema,
} from "@/lib/validations/marca.schema";
import { ZodError } from "zod";

import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: PERMISSIONS.PRODUCTOS, // Mismo permiso que productos por coherencia
    });

    const search = req.nextUrl.searchParams.get("q")?.trim() || "";
    const limitParam = req.nextUrl.searchParams.get("limit");

    const where: any = {
      TenantId: BigInt(tenantId),
    };

    if (search) {
      where.Descripcion = { contains: search, mode: "insensitive" };
    }

    // 1. Obtener Total
    const total = await prisma.marca.count({ where });

    // 2. Si no hay límite, devolver todo
    if (!limitParam) {
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
      });

      return NextResponse.json(
        {
          data: marcas,
          pagination: {
            page: 1,
            limit: total > 0 ? total : 1,
            total,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        { status: 200 },
      );
    }

    // 3. Paginación normal
    const pagination = parsePaginationParams(req);

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

    // 4. Formatear Respuesta
    const response = createPaginationResponse(marcas, total, pagination);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: PERMISSIONS.PRODUCTOS, // Permiso de escritura (agrupado bajo productos)
    });

    const body = await req.json();

    // Validar el body con Zod
    const validatedData = createMarcaSchema.parse(body);

    // Crear la marca con datos validados
    const marca = await prisma.marca.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: BigInt(tenantId),
      },
    });

    return NextResponse.json(
      {
        ...marca,
        Id: Number(marca.Id),
        TenantId: tenantId,
      },
      { status: 201 },
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
        { status: 400 },
      );
    }
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: PERMISSIONS.PRODUCTOS, // Permiso de eliminación
    });

    const idParam =
      req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
    const marcaId = idParam ? Number(idParam) : NaN;

    if (!Number.isInteger(marcaId)) {
      return NextResponse.json(
        { error: "Id de marca invalido" },
        { status: 400 },
      );
    }

    const marcaActualizada = await prisma.marca.delete({
      where: {
        Id: marcaId,
        TenantId: BigInt(tenantId),
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(marcaActualizada.Id) },
      { status: 200 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 },
      );
    }

    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: PERMISSIONS.PRODUCTOS, // Permiso de edición
    });

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
      { status: 201 },
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
        { status: 400 },
      );
    }

    return handleError(error);
  }
}
