import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { requirePermiso } from "@/lib/requirePermiso";
import { handleError } from "@/lib/errors/handler";

/**
 * GET /api/analiticas/complementarios
 * 
 * Retorna datos complementarios del dashboard
 * Query params:
 * - tipo: "gastos" | "usuarios" | "auditoria" | "todos" (default: "todos")
 * - fechaDesde: ISO string (opcional)
 * - fechaHasta: ISO string (opcional)
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("analiticas");
    const searchParams = req.nextUrl.searchParams;
    const tipo = searchParams.get("tipo") || "todos";

    const fechaDesde = searchParams.get("fechaDesde")
      ? new Date(searchParams.get("fechaDesde")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fechaHasta = searchParams.get("fechaHasta")
      ? new Date(searchParams.get("fechaHasta")!)
      : new Date();

    const tenantIdBigInt = BigInt(tenantId);

    const datos: any = {};

    // 1. Panel de gastos y caja
    if (tipo === "todos" || tipo === "gastos") {
      const gastos = await prisma.gasto.findMany({
        where: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          Fecha: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
        },
        include: {
          ConceptoGastos: {
            select: {
              Descripcion: true,
            },
          },
          Caja: {
            select: {
              Id: true,
              FechaApertura: true,
            },
          },
        },
      });

      // Agrupar por concepto
      const gastosPorConcepto: Record<string, number> = {};
      gastos.forEach((gasto) => {
        const concepto = gasto.ConceptoGastos.Descripcion;
        gastosPorConcepto[concepto] = (gastosPorConcepto[concepto] || 0) + Number(gasto.Monto);
      });

      // Obtener cajas del período
      const cajas = await prisma.caja.findMany({
        where: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          FechaApertura: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
        },
        select: {
          Id: true,
          Ganancia: true,
          FechaApertura: true,
          FechaCierre: true,
        },
      });

      const totalGastos = gastos.reduce((sum, g) => sum + Number(g.Monto), 0);
      const totalGanancia = cajas.reduce((sum, c) => sum + Number(c.Ganancia), 0);
      const eficiencia = totalGanancia > 0 ? ((totalGanancia - totalGastos) / totalGanancia) * 100 : 0;

      datos.gastos = {
        total: totalGastos,
        totalGanancia,
        eficiencia,
        porConcepto: Object.entries(gastosPorConcepto)
          .map(([concepto, monto]) => ({
            concepto,
            monto,
            porcentaje: totalGastos > 0 ? (monto / totalGastos) * 100 : 0,
          }))
          .sort((a, b) => b.monto - a.monto),
        cajasAbiertas: cajas.filter((c) => !c.FechaCierre).length,
        cajasCerradas: cajas.filter((c) => c.FechaCierre).length,
      };
    }

    // 2. Panel de usuarios activos
    if (tipo === "todos" || tipo === "usuarios") {
      const sesionesActivas = await prisma.sesionActiva.findMany({
        where: {
          TenantId: tenantIdBigInt,
          EstaActiva: true,
        },
        include: {
          Usuario: {
            select: {
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
      });

      // Agrupar por día
      const usuariosPorDia: Record<string, Set<bigint>> = {};
      const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        return fecha.toISOString().split("T")[0];
      }).reverse();

      ultimos7Dias.forEach((dia) => {
        usuariosPorDia[dia] = new Set();
      });

      sesionesActivas.forEach((sesion) => {
        const dia = sesion.FechaUltimaActividad.toISOString().split("T")[0];
        if (usuariosPorDia[dia]) {
          usuariosPorDia[dia].add(sesion.UsuarioId);
        }
      });

      // Dispositivos no confiables
      const dispositivosNoConfiables = await prisma.sesionActiva.findMany({
        where: {
          TenantId: tenantIdBigInt,
          EstaActiva: true,
          EsConfiable: false,
        },
        include: {
          Usuario: {
            select: {
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
        take: 10,
      });

      datos.usuarios = {
        activosAhora: sesionesActivas.length,
        porDia: ultimos7Dias.map((dia) => ({
          fecha: dia,
          cantidad: usuariosPorDia[dia]?.size || 0,
        })),
        dispositivosNoConfiables: dispositivosNoConfiables.map((d) => ({
          id: Number(d.Id),
          usuario: d.Usuario.Persona_Empleado
            ? `${d.Usuario.Persona_Empleado.Persona.Nombre} ${d.Usuario.Persona_Empleado.Persona.Apellido}`
            : "Desconocido",
          dispositivo: d.Dispositivo || "Desconocido",
          ubicacion: d.Ubicacion,
          ipAddress: d.IpAddress,
          fechaUltimaActividad: d.FechaUltimaActividad.toISOString(),
        })),
      };
    }

    // 3. Feed de auditoría (últimos eventos)
    if (tipo === "todos" || tipo === "auditoria") {
      const auditorias = await prisma.auditoriaEmpleado.findMany({
        where: {
          TenantId: tenantIdBigInt,
          Fecha: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
          },
        },
        include: {
          Usuario: {
            select: {
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
              Persona: {
                select: {
                  Nombre: true,
                  Apellido: true,
                },
              },
            },
          },
        },
        orderBy: {
          Fecha: "desc",
        },
        take: 20,
      });

      datos.auditoria = auditorias.map((aud) => ({
        id: Number(aud.Id),
        fecha: aud.Fecha.toISOString(),
        accion: aud.Accion,
        severidad: aud.Severidad,
        detalle: aud.Detalle,
        usuario: aud.Usuario.Persona_Empleado
          ? `${aud.Usuario.Persona_Empleado.Persona.Nombre} ${aud.Usuario.Persona_Empleado.Persona.Apellido}`
          : "Desconocido",
        empleadoAfectado: aud.Empleado
          ? `${aud.Empleado.Persona.Nombre} ${aud.Empleado.Persona.Apellido}`
          : null,
        ipAddress: aud.IpAddress,
      }));
    }

    return NextResponse.json(datos);
  } catch (error) {
    return handleError(error);
  }
}

