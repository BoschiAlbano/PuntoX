import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { GET_PERMISSIONS } from "@/lib/constants/comprobantes";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.AUDITORIA, // Mismo permiso que productos por coherencia
    });
    const pagination = parsePaginationParams(req);

    const searchParams = req.nextUrl.searchParams;
    const accionFilter = searchParams.get("accion");
    const usuarioIdFilter = searchParams.get("usuarioId");
    const empleadoIdFilter = searchParams.get("empleadoId");
    const fechaDesde = searchParams.get("fechaDesde");
    const fechaHasta = searchParams.get("fechaHasta");
    // Soporte para búsqueda (q o busqueda)
    const search = searchParams.get("q") || searchParams.get("busqueda") || "";

    // Construir where clause base
    const where: any = {
      TenantId: BigInt(tenantId),
    };

    // Agregar filtros específicos
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

    // Agregar búsqueda si existe
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { Accion: { contains: searchTerm, mode: "insensitive" } },
        { Detalle: { contains: searchTerm, mode: "insensitive" } },
        { IpAddress: { contains: searchTerm, mode: "insensitive" } },
        {
          Usuario: {
            OR: [
              { Nombre: { contains: searchTerm, mode: "insensitive" } },
              {
                Persona_Empleado: {
                  Persona: {
                    OR: [
                      { Nombre: { contains: searchTerm, mode: "insensitive" } },
                      {
                        Apellido: { contains: searchTerm, mode: "insensitive" },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      ];
    }

    // Obtener total para paginación
    const total = await prisma.auditoriaEmpleado.count({ where });

    // Obtener auditorías con relaciones (usando select en lugar de include para mejor performance)
    const auditorias = await prisma.auditoriaEmpleado.findMany({
      where,
      select: {
        Id: true,
        Fecha: true,
        Accion: true,
        Detalle: true,
        ValorAnterior: true,
        ValorNuevo: true,
        IpAddress: true,
        UserAgent: true,
        Severidad: true,
        SucursalId: true,
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
      const usuarioNombre = aud.Usuario.Persona_Empleado?.Persona
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
        severidad: aud.Severidad || "INFO",
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
        valorAnterior: aud.ValorAnterior ? JSON.parse(aud.ValorAnterior) : null,
        valorNuevo: aud.ValorNuevo ? JSON.parse(aud.ValorNuevo) : null,
        ipAddress: aud.IpAddress,
        userAgent: aud.UserAgent,
        sucursalId: aud.SucursalId ? Number(aud.SucursalId) : null,
      };
    });

    const paginatedResponse = createPaginationResponse(
      response,
      total,
      pagination,
    );

    return NextResponse.json(paginatedResponse, { status: 200 });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return handleError(error);
  }
}

// Sin POST: las entradas de auditoría solo las escribe el servidor
// (registrarAuditoria). Antes había un POST que, con permiso de LEER la
// auditoría, permitía cargar entradas falsas.
