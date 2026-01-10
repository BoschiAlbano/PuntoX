import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import {
  createRubroSchema,
  updateRubroSchema,
} from "@/lib/validations/rubro.schema";
import { ZodError } from "zod";

import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { createError } from "@/lib/errors/types";
import { handleError } from "@/lib/errors/handler";

import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";

export async function GET(req: NextRequest) {
  // Obtener la session del usuario
  const { tenantId, user, error } = await getAuthUser();

  if (error || !user) {
    return (
      error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  try {
    const pagination = parsePaginationParams(req);
    const search = req.nextUrl.searchParams.get("q")?.trim() || "";
    const sucursalIdParam = req.nextUrl.searchParams.get("sucursalId");

    if (sucursalIdParam) {
      await verifyUserBranchAccess(BigInt(tenantId), user.id, sucursalIdParam);
    }

    const where: any = {
      TenantId: BigInt(tenantId),
    };

    if (search) {
      where.Descripcion = { contains: search, mode: "insensitive" };
    }

    // 1. Obtener Total
    const total = await prisma.rubro.count({ where });

    // 2. Obtener Datos Paginados
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

    // 3. Formatear Respuesta
    const response = createPaginationResponse(rubros, total, pagination);

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
    const validatedData = createRubroSchema.parse(body);

    // Crear la marca con datos validados
    const rubro = await prisma.rubro.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: tenantId,
      },
    });

    return NextResponse.json(
      {
        ...rubro,
        Id: Number(rubro.Id),
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
  const rubroId = idParam ? Number(idParam) : NaN;

  if (!Number.isInteger(rubroId)) {
    return NextResponse.json(
      { error: "Id de rubro invalido" },
      { status: 400 }
    );
  }

  try {
    const rubroActualizada = await prisma.rubro.delete({
      where: {
        Id: rubroId,
        TenantId: tenantId,
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(rubroActualizada.Id) },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Rubro no encontrado" },
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
    const validatedData = updateRubroSchema.parse(body);

    const tenantIdBigInt = BigInt(tenantId);

    // Crear la marca con datos validados
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
