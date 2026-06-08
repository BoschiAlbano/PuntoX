import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";

/**
 * GET /api/admin/dashboard
 * Returns aggregated metrics for the SuperAdmin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Execute all queries in parallel for performance
    const [
      totalTenants,
      activeTenants,
      inactiveTenants,
      pendingOnboarding,
      totalUsuarios,
      totalSucursales,
      totalArticulos,
      recentTenants,
      plans,
    ] = await Promise.all([
      prisma.tenant.count({ where: { EstaEliminado: false } }),
      prisma.tenant.count({ where: { EstaActivo: true, EstaEliminado: false } }),
      prisma.tenant.count({ where: { EstaActivo: false, EstaEliminado: false } }),
      prisma.tenant.count({
        where: { OnboardingCompleto: false, EstaEliminado: false },
      }),
      prisma.usuario.count({ where: { EstaEliminado: false } }),
      prisma.sucursal.count({ where: { EstaEliminado: false } }),
      prisma.articulo.count({ where: { EstaEliminado: false } }),
      prisma.tenant.findMany({
        where: { EstaEliminado: false },
        orderBy: { Id: "desc" },
        take: 5,
        select: {
          Id: true,
          Nombre: true,
          EstaActivo: true,
          OnboardingCompleto: true,
          Plan: { select: { Nombre: true } },
          _count: {
            select: {
              Usuarios: { where: { EstaEliminado: false } },
              Sucursales: { where: { EstaEliminado: false } },
            },
          },
        },
      }),
      prisma.planSaaS.findMany({
        select: {
          Id: true,
          Nombre: true,
          _count: { select: { Tenants: true } },
        },
      }),
    ]);

    // Format recent tenants
    const formattedRecent = recentTenants.map((t) => ({
      id: Number(t.Id),
      nombre: t.Nombre,
      estaActivo: t.EstaActivo,
      onboardingCompleto: t.OnboardingCompleto,
      plan: t.Plan?.Nombre || "Sin plan",
      usuarios: t._count.Usuarios,
      sucursales: t._count.Sucursales,
    }));

    // Format plans distribution
    const planDistribution = plans.map((p) => ({
      id: Number(p.Id),
      nombre: p.Nombre,
      tenants: p._count.Tenants,
    }));

    // Build alerts
    const alertas: { tipo: string; mensaje: string; cantidad: number }[] = [];
    if (pendingOnboarding > 0) {
      alertas.push({
        tipo: "warning",
        mensaje: "Tiendas sin completar onboarding",
        cantidad: pendingOnboarding,
      });
    }
    if (inactiveTenants > 0) {
      alertas.push({
        tipo: "danger",
        mensaje: "Tiendas desactivadas",
        cantidad: inactiveTenants,
      });
    }

    return NextResponse.json({
      metricas: {
        totalTenants,
        activeTenants,
        inactiveTenants,
        pendingOnboarding,
        totalUsuarios,
        totalSucursales,
        totalArticulos,
      },
      recentTenants: formattedRecent,
      planDistribution,
      alertas,
    });
  } catch (error) {
    return handleError(error);
  }
}
