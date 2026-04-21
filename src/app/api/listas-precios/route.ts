import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import {
  createListaPrecioSchema,
  updateListaPrecioSchema,
} from "@/lib/validations/lista-precio.schema";
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
      permission: GET_PERMISSIONS.PRODUCTOS,
    });

    const search = req.nextUrl.searchParams.get("q")?.trim() || "";
    const limitParam = req.nextUrl.searchParams.get("limit");

    const where: any = {
      TenantId: BigInt(tenantId),
    };

    if (search) {
      where.Nombre = { contains: search, mode: "insensitive" };
    }

    // 1. Obtener Total
    const total = await prisma.listaPrecio.count({ where });

    // 2. Si no hay límite, devolver todo
    if (!limitParam) {
      const listasRaw = await prisma.listaPrecio.findMany({
        where,
        select: {
          Id: true,
          Nombre: true,
          PorDefecto: true,
          Activa: true,
          EstaEliminado: true,
          _count: { select: { Precios: true } },
        },
        orderBy: {
          Nombre: "asc",
        },
      });

      const listas = listasRaw.map((l) => ({
        Id: Number(l.Id),
        Nombre: l.Nombre,
        PorDefecto: l.PorDefecto,
        Activa: l.Activa,
        EstaEliminado: l.EstaEliminado,
        CantidadArticulos: l._count.Precios,
      }));

      return NextResponse.json(
        {
          data: listas,
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

    const listasRaw = await prisma.listaPrecio.findMany({
      where,
      select: {
        Id: true,
        Nombre: true,
        PorDefecto: true,
        Activa: true,
        EstaEliminado: true,
        _count: { select: { Precios: true } },
      },
      orderBy: {
        Nombre: "asc",
      },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const listas = listasRaw.map((l) => ({
      Id: Number(l.Id),
      Nombre: l.Nombre,
      PorDefecto: l.PorDefecto,
      Activa: l.Activa,
      EstaEliminado: l.EstaEliminado,
      CantidadArticulos: l._count.Precios,
    }));

    // 4. Formatear Respuesta
    const response = createPaginationResponse(listas, total, pagination);

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
    const validatedData = createListaPrecioSchema.parse(body);

    const tenantIdBigInt = BigInt(tenantId);

    // Si la nueva lista es PorDefecto, debemos desmarcar las demás
    if (validatedData.PorDefecto) {
      await prisma.listaPrecio.updateMany({
        where: { TenantId: tenantIdBigInt, PorDefecto: true },
        data: { PorDefecto: false },
      });
    }

    // Crear la lista con datos validados
    const lista = await prisma.listaPrecio.create({
      data: {
        Nombre: validatedData.Nombre,
        PorDefecto: validatedData.PorDefecto,
        Activa: validatedData.Activa,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: tenantIdBigInt,
      },
    });

    return NextResponse.json(
      {
        ...lista,
        Id: Number(lista.Id),
        TenantId: tenantId,
      },
      { status: 201 },
    );
  } catch (error) {
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
    const listaId = idParam ? Number(idParam) : NaN;

    if (!Number.isInteger(listaId)) {
      return NextResponse.json(
        { error: "Id de lista invalido" },
        { status: 400 },
      );
    }

    const listaActualizada = await prisma.listaPrecio.delete({
      where: {
        Id: listaId,
        TenantId: BigInt(tenantId),
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(listaActualizada.Id) },
      { status: 200 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Lista de precio no encontrada" },
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
    const validatedData = updateListaPrecioSchema.parse(body);

    const tenantIdBigInt = BigInt(tenantId);

    // Si la lista se actualiza a PorDefecto, desmarcamos las demás
    if (validatedData.PorDefecto) {
      await prisma.listaPrecio.updateMany({
        where: { 
          TenantId: tenantIdBigInt, 
          PorDefecto: true,
          Id: { not: BigInt(validatedData.Id) }
        },
        data: { PorDefecto: false },
      });
    }

    // Actualizar con datos validados
    const lista = await prisma.listaPrecio.update({
      where: {
        Id: BigInt(validatedData.Id),
        TenantId: tenantIdBigInt,
      },
      data: {
        Nombre: validatedData.Nombre,
        PorDefecto: validatedData.PorDefecto,
        Activa: validatedData.Activa,
        EstaEliminado: validatedData.EstaEliminado,
      },
    });

    return NextResponse.json(
      {
        ...lista,
        Id: Number(lista.Id),
        TenantId: tenantId,
      },
      { status: 201 },
    );
  } catch (error) {
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
