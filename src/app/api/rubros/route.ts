import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import {
  createRubroSchema,
  updateRubroSchema,
} from "@/lib/validations/rubro.schema";

import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import { Prisma } from "../../../../prisma/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PRODUCTOS, // Permiso de productos para rubros
    });

    const search = req.nextUrl.searchParams.get("q")?.trim() || "";
    const limitParam = req.nextUrl.searchParams.get("limit");

    const where: Prisma.RubroWhereInput = {
      TenantId: BigInt(tenantId),
    };

    if (search) {
      where.Descripcion = { contains: search, mode: "insensitive" };
    }

    // 1. Obtener Total
    const total = await prisma.rubro.count({ where });

    // 2. Si no hay límite, devolver todo
    if (!limitParam) {
      const rubros = await prisma.rubro.findMany({
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
          data: rubros,
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

    const rubros = await prisma.rubro.findMany({
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
    const response = createPaginationResponse(rubros, total, pagination);

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
    const validatedData = createRubroSchema.parse(body);

    // Crear el rubro con datos validados
    const rubro = await prisma.rubro.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: BigInt(tenantId),
      },
    });

    return NextResponse.json(
      {
        ...rubro,
        Id: Number(rubro.Id),
        TenantId: tenantId,
      },
      { status: 201 },
    );
  } catch (error) {
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
    const rubroId = idParam ? Number(idParam) : NaN;

    if (!Number.isInteger(rubroId)) {
      return NextResponse.json(
        { error: "Id de rubro invalido" },
        { status: 400 },
      );
    }

    const rubroActualizada = await prisma.rubro.delete({
      where: {
        Id: rubroId,
        TenantId: BigInt(tenantId),
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(rubroActualizada.Id) },
      { status: 200 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Rubro no encontrado" },
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
    const validatedData = updateRubroSchema.parse(body);

    const tenantIdBigInt = BigInt(tenantId);

    // Actualizar rubro
    const rubro = await prisma.rubro.update({
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
        ...rubro,
        Id: Number(rubro.Id),
        TenantId: tenantId,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
