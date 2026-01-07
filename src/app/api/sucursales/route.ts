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
import { getAuthUser } from "@/lib/auth/getAuthUser";
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
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    // Obtener parámetros de búsqueda
    const searchParams = req.nextUrl.searchParams;
    const soloActivas = searchParams.get("soloActivas") !== "false";
    const incluirEliminadas = searchParams.get("incluirEliminadas") === "true";

    // Construir filtro
    const where: Record<string, unknown> = {
      TenantId: BigInt(tenantId),
    };

    if (!incluirEliminadas) {
      where.EstaEliminado = false;
    }

    if (soloActivas) {
      where.EstaActiva = true;
    }

    // Obtener sucursales
    const sucursales = await prisma.sucursal.findMany({
      where,
      orderBy: [
        { EsPrincipal: "desc" },
        { Nombre: "asc" },
      ],
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

    return NextResponse.json({
      sucursales: sucursales.map((s) => ({
        id: Number(s.Id),
        nombre: s.Nombre,
        direccion: s.Direccion,
        telefono: s.Telefono,
        esPrincipal: s.EsPrincipal,
        estaActiva: s.EstaActiva,
        fechaCreacion: s.FechaCreacion,
        cantidadUsuarios: s._count.UsuariosSucursales,
      })),
    });
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
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

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
        { status: 400 }
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

    // Crear la sucursal
    const nuevaSucursal = await prisma.sucursal.create({
      data: {
        TenantId: BigInt(tenantId),
        Nombre: data.nombre,
        Direccion: data.direccion,
        Telefono: data.telefono,
        EsPrincipal: data.esPrincipal,
        EstaActiva: true,
        EstaEliminado: false,
      },
    });

    return NextResponse.json(
      {
        sucursal: {
          id: Number(nuevaSucursal.Id),
          nombre: nuevaSucursal.Nombre,
          direccion: nuevaSucursal.Direccion,
          telefono: nuevaSucursal.Telefono,
          esPrincipal: nuevaSucursal.EsPrincipal,
          estaActiva: nuevaSucursal.EstaActiva,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }
    return handleError(error);
  }
}

