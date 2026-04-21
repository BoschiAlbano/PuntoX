import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import {
  createUnidadMedidaSchema,
  updateUnidadMedidaSchema,
} from "@/lib/validations/unidad-medida.schema";
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
      permission: GET_PERMISSIONS.PRODUCTOS, // Permiso compartido
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
    const total = await prisma.unidadMedida.count({ where });

    // 2. Si no hay límite, devolver todo
    if (!limitParam) {
      const unidadesMedida = await prisma.unidadMedida.findMany({
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
          data: unidadesMedida,
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

    const unidadesMedida = await prisma.unidadMedida.findMany({
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
    const response = createPaginationResponse(
      unidadesMedida,
      total,
      pagination,
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.PRODUCTOS,
    });

    const body = await req.json();

    // Validar el body con Zod
    const validatedData = createUnidadMedidaSchema.parse(body);

    // Crear la marca con datos validados
    const unidadMedida = await prisma.unidadMedida.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: BigInt(tenantId),
      },
    });

    return NextResponse.json(
      {
        ...unidadMedida,
        Id: Number(unidadMedida.Id),
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
      permission: SET_PERMISSIONS.PRODUCTOS,
    });

    const idParam =
      req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
    const unidadMedidaId = idParam ? Number(idParam) : NaN;

    if (!Number.isInteger(unidadMedidaId)) {
      return NextResponse.json(
        { error: "Id de unidad de medida invalido" },
        { status: 400 },
      );
    }

    const unidadMedidaActualizada = await prisma.unidadMedida.delete({
      where: {
        Id: unidadMedidaId,
        TenantId: BigInt(tenantId),
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(unidadMedidaActualizada.Id) },
      { status: 200 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Unidad de medida no encontrada" },
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
      permission: SET_PERMISSIONS.PRODUCTOS,
    });

    const body = await req.json();

    // Validar el body con Zod
    const validatedData = updateUnidadMedidaSchema.parse(body);

    const tenantIdBigInt = BigInt(tenantId);

    // Crear la marca con datos validados
    const unidadMedida = await prisma.unidadMedida.update({
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
        ...unidadMedida,
        Id: Number(unidadMedida.Id),
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
