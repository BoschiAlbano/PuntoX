/**
 * =====================================================
 * API DE SUCURSAL INDIVIDUAL
 * =====================================================
 *
 * GET    /api/sucursales/[id]      - Obtener sucursal
 * PATCH  /api/sucursales/[id]      - Actualizar sucursal
 * DELETE /api/sucursales/[id]      - Eliminar sucursal
 *
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";

// Schema de validación para actualizar sucursal
const actualizarSucursalSchema = z.object({
  nombre: z.string().min(1).max(250).optional(),
  direccion: z.string().max(400).nullable().optional(),
  telefono: z.string().max(25).nullable().optional(),
  esPrincipal: z.boolean().optional(),
  estaActiva: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/sucursales/[id]
 * Obtiene una sucursal por ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.SUCURSALES,
    });

    const { id } = await params;
    const sucursalId = BigInt(id);

    const sucursal = await prisma.sucursal.findFirst({
      where: {
        Id: sucursalId,
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      include: {
        UsuariosSucursales: {
          include: {
            Usuario: {
              select: {
                Id: true,
                Nombre: true,
                Persona_Empleado: {
                  select: {
                    Persona: {
                      select: {
                        Nombre: true,
                        Apellido: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            Cajas: true,
            Comprobantes: true,
          },
        },
      },
    });

    if (!sucursal) {
      return NextResponse.json(
        { error: "Sucursal no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      sucursal: {
        Id: Number(sucursal.Id),
        nombre: sucursal.Nombre,
        direccion: sucursal.Direccion,
        telefono: sucursal.Telefono,
        esPrincipal: sucursal.EsPrincipal,
        estaActiva: sucursal.EstaActiva,
        fechaCreacion: sucursal.FechaCreacion,
        usuarios: sucursal.UsuariosSucursales.map((us) => ({
          id: Number(us.Usuario.Id),
          nombre: us.Usuario.Nombre,
          nombreCompleto: us.Usuario.Persona_Empleado?.Persona
            ? `${us.Usuario.Persona_Empleado.Persona.Nombre} ${us.Usuario.Persona_Empleado.Persona.Apellido}`
            : us.Usuario.Nombre,
          esDefault: us.EsDefault,
        })),
        estadisticas: {
          totalCajas: sucursal._count.Cajas,
          totalComprobantes: sucursal._count.Comprobantes,
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/sucursales/[id]
 * Actualiza una sucursal
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.SUCURSALES,
    });

    const { id } = await params;
    const sucursalId = BigInt(id);

    // Verificar que la sucursal existe y pertenece al tenant
    const sucursalExistente = await prisma.sucursal.findFirst({
      where: {
        Id: sucursalId,
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
    });

    if (!sucursalExistente) {
      return NextResponse.json(
        { error: "Sucursal no encontrada" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const data = actualizarSucursalSchema.parse(body);

    // Si cambia el nombre, verificar que no exista otra con ese nombre
    if (data.nombre && data.nombre !== sucursalExistente.Nombre) {
      const nombreDuplicado = await prisma.sucursal.findFirst({
        where: {
          TenantId: BigInt(tenantId),
          Nombre: data.nombre,
          EstaEliminado: false,
          Id: { not: sucursalId },
        },
      });

      if (nombreDuplicado) {
        return NextResponse.json(
          { error: "Ya existe una sucursal con ese nombre" },
          { status: 400 },
        );
      }
    }

    // Si se marca como principal, quitar el flag de las demás
    if (data.esPrincipal === true && !sucursalExistente.EsPrincipal) {
      await prisma.sucursal.updateMany({
        where: {
          TenantId: BigInt(tenantId),
          EsPrincipal: true,
          Id: { not: sucursalId },
        },
        data: {
          EsPrincipal: false,
        },
      });
    }

    // Actualizar sucursal
    const sucursalActualizada = await prisma.sucursal.update({
      where: { Id: sucursalId },
      data: {
        ...(data.nombre && { Nombre: data.nombre }),
        ...(data.direccion !== undefined && { Direccion: data.direccion }),
        ...(data.telefono !== undefined && { Telefono: data.telefono }),
        ...(data.esPrincipal !== undefined && {
          EsPrincipal: data.esPrincipal,
        }),
        ...(data.estaActiva !== undefined && { EstaActiva: data.estaActiva }),
      },
    });

    return NextResponse.json({
      sucursal: {
        Id: Number(sucursalActualizada.Id),
        nombre: sucursalActualizada.Nombre,
        direccion: sucursalActualizada.Direccion,
        telefono: sucursalActualizada.Telefono,
        esPrincipal: sucursalActualizada.EsPrincipal,
        estaActiva: sucursalActualizada.EstaActiva,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Datos inválidos" },
        { status: 400 },
      );
    }
    return handleError(error);
  }
}

/**
 * DELETE /api/sucursales/[id]
 * Elimina (soft delete) una sucursal
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.SUCURSALES,
    });

    const { id } = await params;
    const sucursalId = BigInt(id);

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
        { status: 404 },
      );
    }

    // No permitir eliminar la sucursal principal
    if (sucursal.EsPrincipal) {
      return NextResponse.json(
        { error: "No se puede eliminar la sucursal principal" },
        { status: 400 },
      );
    }

    // Verificar que no tenga cajas abiertas
    const cajasAbiertas = await prisma.caja.count({
      where: {
        SucursalId: sucursalId,
        FechaCierre: null,
        EstaEliminado: false,
      },
    });

    if (cajasAbiertas > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una sucursal con cajas abiertas" },
        { status: 400 },
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
