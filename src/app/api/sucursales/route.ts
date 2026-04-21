/**
 * =====================================================
 * API DE SUCURSALES
 * =====================================================
 *
 * Endpoints para gestión de sucursales del tenant.
 *
 * GET    /api/sucursales           - Listar sucursales del tenant
 * POST   /api/sucursales           - Crear nueva sucursal
 *
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";

import { handleError } from "@/lib/errors/handler";

// Schema de validación para crear sucursal
const crearSucursalSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(250),
  direccion: z.string().max(400).optional(),
  telefono: z.string().max(25).optional(),
  esPrincipal: z.boolean().optional().default(false),
});

/**
 * GET /api/sucursales
 * Lista todas las sucursales del tenant
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.SUCURSALES,
    });

    // Obtener parámetros de búsqueda y paginación
    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePaginationParams(req);
    const busqueda = searchParams.get("q")?.trim() || "";
    const soloActivas = searchParams.get("soloActivas") !== "false";
    const incluirEliminadas = searchParams.get("incluirEliminadas") === "true";

    // Construir filtro
    const where: any = {
      TenantId: BigInt(tenantId),
    };

    if (!incluirEliminadas) {
      where.EstaEliminado = false;
    }

    if (soloActivas) {
      where.EstaActiva = true;
    }

    if (busqueda) {
      where.OR = [
        { Nombre: { contains: busqueda, mode: "insensitive" } },
        { Direccion: { contains: busqueda, mode: "insensitive" } },
      ];
    }

    const total = await prisma.sucursal.count({ where });

    // Obtener sucursales
    const sucursales = await prisma.sucursal.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: [{ EsPrincipal: "desc" }, { Nombre: "asc" }],
      select: {
        Id: true,
        Nombre: true,
        Direccion: true,
        Telefono: true,
        EsPrincipal: true,
        EstaActiva: true,
        FechaCreacion: true,
        _count: {
          select: {
            UsuariosSucursales: true,
          },
        },
      },
    });

    const mappedSucursales = sucursales.map((s) => ({
      Id: Number(s.Id),
      nombre: s.Nombre,
      direccion: s.Direccion,
      telefono: s.Telefono,
      esPrincipal: s.EsPrincipal,
      estaActiva: s.EstaActiva,
      fechaCreacion: s.FechaCreacion,
      cantidadUsuarios: s._count.UsuariosSucursales,
    }));

    const paginatedResponse = createPaginationResponse(
      mappedSucursales,
      total,
      pagination
    );

    return NextResponse.json(paginatedResponse);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/sucursales
 * Crea una nueva sucursal
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.SUCURSALES,
    });

    const body = await req.json();
    const data = crearSucursalSchema.parse(body);

    // Verificar que no exista una sucursal con el mismo nombre
    const existente = await prisma.sucursal.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        Nombre: data.nombre,
        EstaEliminado: false,
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe una sucursal con ese nombre" },
        { status: 400 },
      );
    }

    // Si se marca como principal, quitar el flag de las demás
    if (data.esPrincipal) {
      await prisma.sucursal.updateMany({
        where: {
          TenantId: BigInt(tenantId),
          EsPrincipal: true,
        },
        data: {
          EsPrincipal: false,
        },
      });
    }

    // Crear la sucursal y asignar al usuario creador
    const nuevaSucursal = await prisma.sucursal.create({
      data: {
        TenantId: BigInt(tenantId),
        Nombre: data.nombre,
        Direccion: data.direccion,
        Telefono: data.telefono,
        EsPrincipal: data.esPrincipal,
        EstaActiva: true,
        EstaEliminado: false,
        // Crear relación automática con el usuario creador
        UsuariosSucursales: {
          create: {
            TenantId: BigInt(tenantId),
            UsuarioId: BigInt(usuarioId),
            EsDefault: false, // Por defecto no es la principal del usuario, salvo que sea la única
          },
        },
      },
    });

    return NextResponse.json(
      {
        sucursal: {
          Id: Number(nuevaSucursal.Id),
          nombre: nuevaSucursal.Nombre,
          direccion: nuevaSucursal.Direccion,
          telefono: nuevaSucursal.Telefono,
          esPrincipal: nuevaSucursal.EsPrincipal,
          estaActiva: nuevaSucursal.EstaActiva,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/sucursales?Id=[id]
 * Elimina (soft delete) una sucursal
 */
export async function DELETE(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.SUCURSALES,
    });

    const searchParams = req.nextUrl.searchParams;
    const sucursalIdParam = searchParams.get("Id") || searchParams.get("id");

    if (!sucursalIdParam) {
      return NextResponse.json(
        { error: "ID de sucursal requerido" },
        { status: 400 }
      );
    }

    const sucursalId = BigInt(sucursalIdParam);

    // Verificar que la sucursal existe
    const sucursal = await prisma.sucursal.findFirst({
      where: {
        Id: sucursalId,
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
    });

    if (!sucursal) {
      return NextResponse.json(
        { error: "Sucursal no encontrada" },
        { status: 404 }
      );
    }

    // No permitir eliminar la sucursal principal
    if (sucursal.EsPrincipal) {
      return NextResponse.json(
        { error: "No se puede eliminar la sucursal principal" },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.sucursal.update({
      where: { Id: sucursalId },
      data: {
        EstaEliminado: true,
        EstaActiva: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
