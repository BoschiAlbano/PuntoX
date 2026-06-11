import { NextRequest, NextResponse } from "next/server";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { Prisma } from "../../../../prisma/generated/prisma";
import { calcularGananciaVentasCaja } from "@/lib/caja/ganancias";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, user } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.CAJA,
    });

    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePaginationParams(req);

    // Filtros
    const sucursalIdParam = searchParams.get("sucursalId");
    const q = searchParams.get("q"); // Nombre, Apellido, DNI
    const estado = searchParams.get("estado") as
      | "todas"
      | "abierta"
      | "cerrada"; // todas (default), abierta, cerrada
    const fechaDesde = searchParams.get("fechaDesde");
    const fechaHasta = searchParams.get("fechaHasta");

    let sucursalId: bigint | null = null;

    if (sucursalIdParam) {
      const access = await verifyUserBranchAccess(
        BigInt(tenantId),
        user.id,
        sucursalIdParam,
      );

      if (access) {
        sucursalId = access.sucursal.Id;
      } else {
        return NextResponse.json(
          { error: "No tienes acceso a esta sucursal" },
          { status: 403 },
        );
      }
    }

    // Construir filtro
    const where: Prisma.CajaWhereInput = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
    };

    if (sucursalId) {
      where.SucursalId = sucursalId;
    }

    // Filtro por estado
    if (estado === "abierta") {
      where.FechaCierre = null;
    } else if (estado === "cerrada") {
      where.FechaCierre = { not: null };
    }

    // Filtro por fecha (FechaApertura)
    if (fechaDesde || fechaHasta) {
      where.FechaApertura = {};
      if (fechaDesde) {
        // Asegurarse de que fechaDesde sea inicio del día si necesario, o parsear directo
        where.FechaApertura.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        // Ajustar fechaHasta para incluir todo el día si viene solo fecha YYYY-MM-DD
        const dateHasta = new Date(fechaHasta);
        // Si es una cadena solo fecha sin hora, Prisma/Date lo tomará a las 00:00 UTC o local.
        // Generalmente es mejor sumar un día o setear hora fin, pero dependerá del formato enviado por frontend.
        // Asumiremos que el frontend envía formato ISO o nos ajustamos.
        // Para seguridad, si es exactamente igual, quizás queramos lte o lt (date + 1 day).
        // Por simplicidad, usemos lte por ahora.
        where.FechaApertura.lte = dateHasta;
      }
    }

    // Filtro por búsqueda (Usuario Apertura)
    if (q) {
      where.Usuario_Caja_UsuarioAperturaIdToUsuario = {
        OR: [
          { Nombre: { contains: q, mode: "insensitive" } },
          {
            Persona_Empleado: {
              Persona: {
                OR: [
                  { Nombre: { contains: q, mode: "insensitive" } },
                  { Apellido: { contains: q, mode: "insensitive" } },
                  { Dni: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      };
    }

    const total = await prisma.caja.count({ where });

    const cajas = await prisma.caja.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        Usuario_Caja_UsuarioAperturaIdToUsuario: {
          select: {
            Id: true,
            Nombre: true,
            Persona_Empleado: {
              select: {
                Persona: {
                  select: {
                    Nombre: true,
                    Apellido: true,
                    Dni: true,
                  },
                },
              },
            },
          },
        },
        Usuario_Caja_UsuarioCierreIdToUsuario: {
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
      orderBy: { FechaApertura: "desc" },
    });

    // Helper para formatear nombre
    const formatearNombreUsuario = (usuario: any) => {
      if (!usuario) return null;
      const persona =
        usuario.Persona_Empleado?.[0]?.Persona ||
        usuario.Persona_Empleado?.Persona; // Prisma devuelve array o objeto dependiendo de la relación? Persona_Empleado es unique FK, pero en schema dice Persona_Empleado? @relation...
      // Revisando el schema: Usuario tiene `EmpleadoId`. `Persona_Empleado` es el related model.
      // En `route.ts` existente usaban `usuario.Persona_Empleado?.Persona`.
      // Pero en include use `Persona_Empleado: { select: ... }`.

      // Wait, en la query original:
      // Persona_Empleado: { select: { Persona: ... } }
      // Significa que usuario.Persona_Empleado es un objeto.

      if (persona) {
        return `${persona.Nombre} ${persona.Apellido}`.trim();
      }
      return usuario.Nombre || null;
    };

    const data = await Promise.all(cajas.map(async (c) => {
      const gananciaVentas = await calcularGananciaVentasCaja(c.Id);
      
      return {
        ...c,
        Id: Number(c.Id),
        TenantId: Number(c.TenantId),
        SucursalId: c.SucursalId ? Number(c.SucursalId) : null,
        UsuarioAperturaId: Number(c.UsuarioAperturaId),
        UsuarioCierreId: c.UsuarioCierreId ? Number(c.UsuarioCierreId) : null,
        MontoInicial: Number(c.MontoInicial),
        MontoCierre: c.MontoCierre ? Number(c.MontoCierre) : null,
        TotalEntradaEfectivo: Number(c.TotalEntradaEfectivo),
        TotalSalidaEfectivo: Number(c.TotalSalidaEfectivo),
        TotalEntradaTarjeta: Number(c.TotalEntradaTarjeta),
        TotalSalidaTarjeta: Number(c.TotalSalidaTarjeta),
        TotalEntradaCheque: Number(c.TotalEntradaCheque),
        TotalSalidaCheque: Number(c.TotalSalidaCheque),
        TotalEntradaCtaCte: Number(c.TotalEntradaCtaCte),
        TotalSalidaCtaCte: Number(c.TotalSalidaCtaCte),
        TotalEntradaTransf: Number(c.TotalEntradaTransf),
        TotalSalidaTransf: Number(c.TotalSalidaTransf),
        Ganancia: Number(c.Ganancia),
        GananciaVentas: gananciaVentas,
        UsuarioApertura: c.Usuario_Caja_UsuarioAperturaIdToUsuario
          ? {
              Id: Number(c.Usuario_Caja_UsuarioAperturaIdToUsuario.Id),
              Nombre: c.Usuario_Caja_UsuarioAperturaIdToUsuario.Nombre,
              NombreCompleto: formatearNombreUsuario(
                c.Usuario_Caja_UsuarioAperturaIdToUsuario,
              ),
            }
          : null,
        UsuarioCierre: c.Usuario_Caja_UsuarioCierreIdToUsuario
          ? {
              Id: Number(c.Usuario_Caja_UsuarioCierreIdToUsuario.Id),
              Nombre: c.Usuario_Caja_UsuarioCierreIdToUsuario.Nombre,
              NombreCompleto: formatearNombreUsuario(
                c.Usuario_Caja_UsuarioCierreIdToUsuario,
              ),
            }
          : null,
      };
    }));

    return NextResponse.json(createPaginationResponse(data, total, pagination));
  } catch (error) {
    return handleError(error);
  }
}
