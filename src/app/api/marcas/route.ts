import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
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
import { ejecutarBorradoFisico } from "@/lib/errors/hardDelete";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PRODUCTOS, // Mismo permiso que productos por coherencia
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
    const total = await prisma.marca.count({ where });

    // 2. Si no hay límite, devolver todo
    if (!limitParam) {
      const marcasRaw = await prisma.marca.findMany({
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

      const marcas = marcasRaw.map((m) => ({
        Id: Number(m.Id),
        Descripcion: m.Descripcion,
        EstaEliminado: m.EstaEliminado,
        CantidadProductos: m._count.Articulo,
      }));

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

    const marcasRaw = await prisma.marca.findMany({
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

    const marcas = marcasRaw.map((m) => ({
      Id: Number(m.Id),
      Descripcion: m.Descripcion,
      EstaEliminado: m.EstaEliminado,
      CantidadProductos: m._count.Articulo,
    }));

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
      permission: SET_PERMISSIONS.PRODUCTOS, // Permiso de escritura (agrupado bajo productos)
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
      permission: SET_PERMISSIONS.PRODUCTOS, // Permiso de eliminación
    });

    const idParam =
      req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
    const marcaId = idParam ? Number(idParam) : NaN;
    const permanente = req.nextUrl.searchParams.get("permanente") === "true";

    if (!Number.isInteger(marcaId)) {
      return NextResponse.json(
        { error: "Id de marca invalido" },
        { status: 400 },
      );
    }

    const tenantIdBigInt = BigInt(tenantId);

    const marcaActual = await prisma.marca.findUnique({
      where: { Id: marcaId, TenantId: tenantIdBigInt },
      select: { EstaEliminado: true },
    });

    if (!marcaActual) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 },
      );
    }

    if (permanente) {
      if (!marcaActual.EstaEliminado) {
        return NextResponse.json(
          {
            error:
              "Primero tenés que desactivar la marca antes de eliminarla definitivamente",
          },
          { status: 400 },
        );
      }

      await ejecutarBorradoFisico(
        () =>
          prisma.marca.delete({
            where: { Id: marcaId, TenantId: tenantIdBigInt },
          }),
        "No se puede eliminar definitivamente: la marca tiene productos asociados.",
      );

      return NextResponse.json(
        { success: true, Id: marcaId },
        { status: 200 },
      );
    }

    // Toggle: invertir el estado
    const marcaActualizada = await prisma.marca.update({
      where: { Id: marcaId, TenantId: tenantIdBigInt },
      data: { EstaEliminado: !marcaActual.EstaEliminado },
      select: { Id: true },
    });

    return NextResponse.json(
      { success: true, Id: Number(marcaActualizada.Id) },
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
      permission: SET_PERMISSIONS.PRODUCTOS, // Permiso de edición
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
