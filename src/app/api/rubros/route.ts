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
import { ejecutarBorradoFisico } from "@/lib/errors/hardDelete";
import { Prisma } from "../../../../prisma/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PRODUCTOS, // Permiso de productos para rubros
    });

    const search = req.nextUrl.searchParams.get("q")?.trim() || "";
    const limitParam = req.nextUrl.searchParams.get("limit");
    const incluirInactivos =
      req.nextUrl.searchParams.get("incluirInactivos") === "true";

    const where: Prisma.RubroWhereInput = {
      TenantId: BigInt(tenantId),
      ...(incluirInactivos ? {} : { EstaEliminado: false }),
    };

    if (search) {
      where.Descripcion = { contains: search, mode: "insensitive" };
    }

    // 1. Obtener Total
    const total = await prisma.rubro.count({ where });

    // 2. Si no hay límite, devolver todo
    if (!limitParam) {
      const rubrosRaw = await prisma.rubro.findMany({
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

      const rubros = rubrosRaw.map((r) => ({
        Id: Number(r.Id),
        Descripcion: r.Descripcion,
        EstaEliminado: r.EstaEliminado,
        CantidadProductos: r._count.Articulo,
      }));

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

    const rubrosRaw = await prisma.rubro.findMany({
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

    const rubros = rubrosRaw.map((r) => ({
      Id: Number(r.Id),
      Descripcion: r.Descripcion,
      EstaEliminado: r.EstaEliminado,
      CantidadProductos: r._count.Articulo,
    }));

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
    const permanente = req.nextUrl.searchParams.get("permanente") === "true";

    if (!Number.isInteger(rubroId)) {
      return NextResponse.json(
        { error: "Id de rubro invalido" },
        { status: 400 },
      );
    }

    const tenantIdBigInt = BigInt(tenantId);

    const rubroActual = await prisma.rubro.findUnique({
      where: { Id: rubroId, TenantId: tenantIdBigInt },
      select: { EstaEliminado: true },
    });

    if (!rubroActual) {
      return NextResponse.json(
        { error: "Rubro no encontrado" },
        { status: 404 },
      );
    }

    if (permanente) {
      if (!rubroActual.EstaEliminado) {
        return NextResponse.json(
          {
            error:
              "Primero tenés que desactivar el rubro antes de eliminarlo definitivamente",
          },
          { status: 400 },
        );
      }

      await ejecutarBorradoFisico(
        () =>
          prisma.rubro.delete({
            where: { Id: rubroId, TenantId: tenantIdBigInt },
          }),
        "No se puede eliminar definitivamente: el rubro tiene productos asociados.",
      );

      return NextResponse.json(
        { success: true, Id: rubroId },
        { status: 200 },
      );
    }

    // Toggle: invertir el estado
    const rubroActualizado = await prisma.rubro.update({
      where: { Id: rubroId, TenantId: tenantIdBigInt },
      data: { EstaEliminado: !rubroActual.EstaEliminado },
      select: { Id: true },
    });

    return NextResponse.json(
      { success: true, Id: Number(rubroActualizado.Id) },
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
