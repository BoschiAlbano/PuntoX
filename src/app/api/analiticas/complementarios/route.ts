import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS } from "@/lib/constants/comprobantes";

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
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.ANALITICAS, // Mismo permiso que productos por coherencia
    });
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
        gastosPorConcepto[concepto] =
          (gastosPorConcepto[concepto] || 0) + Number(gasto.Monto);
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
      const totalGanancia = cajas.reduce(
        (sum, c) => sum + Number(c.Ganancia),
        0,
      );
      const eficiencia =
        totalGanancia > 0
          ? ((totalGanancia - totalGastos) / totalGanancia) * 100
          : 0;

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



    return NextResponse.json(datos);
  } catch (error) {
    return handleError(error);
  }
}
