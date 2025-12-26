import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { requirePermiso, PermisoError } from "@/lib/requirePermiso";
import { parsePaginationParams, createPaginationResponse } from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";

/**
 * GET /api/auditoria-empleados
 * Consulta las auditorías de acciones sobre empleados/usuarios
 * 
 * Query params:
 * - page: número de página (default: 1)
 * - limit: cantidad por página (default: 20)
 * - accion: filtrar por tipo de acción
 * - usuarioId: filtrar por usuario que realizó la acción
 * - empleadoId: filtrar por empleado afectado
 * - fechaDesde: fecha desde (ISO string)
 * - fechaHasta: fecha hasta (ISO string)
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("empleados:admin");
    const pagination = parsePaginationParams(req);

    const searchParams = req.nextUrl.searchParams;
    const accionFilter = searchParams.get("accion");
    const usuarioIdFilter = searchParams.get("usuarioId");
    const empleadoIdFilter = searchParams.get("empleadoId");
    const fechaDesde = searchParams.get("fechaDesde");
    const fechaHasta = searchParams.get("fechaHasta");

    // Construir where clause
    const where: any = {
      TenantId: BigInt(tenantId),
    };

    if (accionFilter) {
      where.Accion = accionFilter;
    }

    if (usuarioIdFilter) {
      const usuarioId = Number(usuarioIdFilter);
      if (!Number.isNaN(usuarioId)) {
        where.UsuarioId = BigInt(usuarioId);
      }
    }

    if (empleadoIdFilter) {
      const empleadoId = Number(empleadoIdFilter);
      if (!Number.isNaN(empleadoId)) {
        where.EmpleadoId = BigInt(empleadoId);
      }
    }

    if (fechaDesde || fechaHasta) {
      where.Fecha = {};
      if (fechaDesde) {
        where.Fecha.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.Fecha.lte = new Date(fechaHasta);
      }
    }

    // Obtener total para paginación
    const total = await prisma.auditoriaEmpleado.count({ where });

    // Obtener auditorías con relaciones
    const auditorias = await prisma.auditoriaEmpleado.findMany({
      where,
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
        Empleado: {
          select: {
            Id: true,
            Persona: {
              select: {
                Nombre: true,
                Apellido: true,
                Mail: true,
              },
            },
          },
        },
        UsuarioAfectado: {
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
      orderBy: { Fecha: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    });

    // Mapear respuesta
    const response = auditorias.map((aud) => {
      const usuarioNombre =
        aud.Usuario.Persona_Empleado?.Persona
          ? `${aud.Usuario.Persona_Empleado.Persona.Nombre} ${aud.Usuario.Persona_Empleado.Persona.Apellido}`
          : aud.Usuario.Nombre;

      const empleadoNombre = aud.Empleado
        ? `${aud.Empleado.Persona.Nombre} ${aud.Empleado.Persona.Apellido}`
        : null;

      const usuarioAfectadoNombre = aud.UsuarioAfectado
        ? aud.UsuarioAfectado.Persona_Empleado?.Persona
          ? `${aud.UsuarioAfectado.Persona_Empleado.Persona.Nombre} ${aud.UsuarioAfectado.Persona_Empleado.Persona.Apellido}`
          : aud.UsuarioAfectado.Nombre
        : null;

      return {
        id: Number(aud.Id),
        fecha: aud.Fecha.toISOString(),
        accion: aud.Accion,
        severidad: aud.Severidad,
        usuario: {
          id: Number(aud.Usuario.Id),
          nombre: usuarioNombre,
        },
        empleado: aud.Empleado
          ? {
              id: Number(aud.Empleado.Id),
              nombre: empleadoNombre,
              email: aud.Empleado.Persona.Mail,
            }
          : null,
        usuarioAfectado: aud.UsuarioAfectado
          ? {
              id: Number(aud.UsuarioAfectado.Id),
              nombre: usuarioAfectadoNombre,
            }
          : null,
        detalle: aud.Detalle,
        valorAnterior: aud.ValorAnterior
          ? JSON.parse(aud.ValorAnterior)
          : null,
        valorNuevo: aud.ValorNuevo ? JSON.parse(aud.ValorNuevo) : null,
        ipAddress: aud.IpAddress,
        userAgent: aud.UserAgent,
      };
    });

    const paginatedResponse = createPaginationResponse(
      response,
      total,
      pagination
    );

    return NextResponse.json(paginatedResponse, { status: 200 });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return handleError(error);
  }
}

/**
 * POST /api/auditoria-empleados
 * Registra una nueva auditoría (usado principalmente para testing o casos especiales)
 * En la mayoría de los casos, se usa la función helper registrarAuditoria()
 */
const crearAuditoriaSchema = z.object({
  accion: z.enum([
    "CREAR_USUARIO",
    "EDITAR_USUARIO",
    "INVITAR_USUARIO",
    "REENVIAR_INVITACION",
    "ACEPTAR_INVITACION",
    "CAMBIAR_ROL",
    "CAMBIAR_PASSWORD",
    "SUSPENDER_USUARIO",
    "REACTIVAR_USUARIO",
    "ELIMINAR_USUARIO",
    "CREAR_ROL",
    "EDITAR_ROL",
    "ELIMINAR_ROL",
    "CAMBIAR_CONFIG_SEGURIDAD",
  ]),
  empleadoId: z.number().optional().nullable(),
  usuarioAfectadoId: z.number().optional().nullable(),
  detalle: z.string().optional().nullable(),
  valorAnterior: z.record(z.string(), z.unknown()).optional().nullable(),
  valorNuevo: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await requirePermiso("empleados:admin");

    const json = await req.json().catch(() => null);
    const parsed = crearAuditoriaSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    await registrarAuditoria({
      tenantId,
      usuarioId,
      accion: data.accion,
      empleadoId: data.empleadoId ?? null,
      usuarioAfectadoId: data.usuarioAfectadoId ?? null,
      detalle: data.detalle ?? undefined,
      valorAnterior: data.valorAnterior ?? null,
      valorNuevo: data.valorNuevo ?? null,
    });

    return NextResponse.json(
      { message: "Auditoría registrada correctamente" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return handleError(error);
  }
}

