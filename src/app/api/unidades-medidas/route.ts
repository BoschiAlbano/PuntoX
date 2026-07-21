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
import { ejecutarBorradoFisico } from "@/lib/errors/hardDelete";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PRODUCTOS, // Permiso compartido
    });

    const search = req.nextUrl.searchParams.get("q")?.trim() || "";
    const limitParam = req.nextUrl.searchParams.get("limit");
    const incluirInactivos =
      req.nextUrl.searchParams.get("incluirInactivos") === "true";

    const where: any = {
      TenantId: BigInt(tenantId),
      ...(incluirInactivos ? {} : { EstaEliminado: false }),
    };

    if (search) {
      where.Descripcion = { contains: search, mode: "insensitive" };
    }

    // 1. Obtener Total
    const total = await prisma.unidadMedida.count({ where });

    // 2. Si no hay límite, devolver todo
    if (!limitParam) {
      const unidadesMedidaRaw = await prisma.unidadMedida.findMany({
        where,
        select: {
          Id: true,
          Descripcion: true,
          EstaEliminado: true,
          _count: { select: { Articulo: true } },
        },
        orderBy: {
          Descripcion: "asc",
        },
      });

      const unidadesMedida = unidadesMedidaRaw.map((u) => ({
        Id: Number(u.Id),
        Descripcion: u.Descripcion,
        EstaEliminado: u.EstaEliminado,
        CantidadProductos: u._count.Articulo,
      }));

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

    const unidadesMedidaRaw = await prisma.unidadMedida.findMany({
      where,
      select: {
        Id: true,
        Descripcion: true,
        EstaEliminado: true,
        _count: { select: { Articulo: true } },
      },
      orderBy: {
        Descripcion: "asc",
      },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const unidadesMedida = unidadesMedidaRaw.map((u) => ({
      Id: Number(u.Id),
      Descripcion: u.Descripcion,
      EstaEliminado: u.EstaEliminado,
      CantidadProductos: u._count.Articulo,
    }));

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
    const permanente = req.nextUrl.searchParams.get("permanente") === "true";

    if (!Number.isInteger(unidadMedidaId)) {
      return NextResponse.json(
        { error: "Id de unidad de medida invalido" },
        { status: 400 },
      );
    }

    const tenantIdBigInt = BigInt(tenantId);

    const unidadMedidaActual = await prisma.unidadMedida.findUnique({
      where: { Id: unidadMedidaId, TenantId: tenantIdBigInt },
      select: { EstaEliminado: true },
    });

    if (!unidadMedidaActual) {
      return NextResponse.json(
        { error: "Unidad de medida no encontrada" },
        { status: 404 },
      );
    }

    if (permanente) {
      if (!unidadMedidaActual.EstaEliminado) {
        return NextResponse.json(
          {
            error:
              "Primero tenés que desactivar la unidad de medida antes de eliminarla definitivamente",
          },
          { status: 400 },
        );
      }

      await ejecutarBorradoFisico(
        () =>
          prisma.unidadMedida.delete({
            where: { Id: unidadMedidaId, TenantId: tenantIdBigInt },
          }),
        "No se puede eliminar definitivamente: la unidad de medida tiene productos asociados.",
      );

      return NextResponse.json(
        { success: true, Id: unidadMedidaId },
        { status: 200 },
      );
    }

    // Toggle: invertir el estado
    const unidadMedidaActualizada = await prisma.unidadMedida.update({
      where: { Id: unidadMedidaId, TenantId: tenantIdBigInt },
      data: { EstaEliminado: !unidadMedidaActual.EstaEliminado },
      select: { Id: true },
    });

    return NextResponse.json(
      { success: true, Id: Number(unidadMedidaActualizada.Id) },
      { status: 200 },
    );
  } catch (error) {
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
