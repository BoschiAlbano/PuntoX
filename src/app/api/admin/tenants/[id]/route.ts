import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";

/**
 * GET /api/admin/tenants/[id]
 * Returns detailed info for a specific tenant
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = BigInt(id);

    const tenant = await prisma.tenant.findUnique({
      where: { Id: tenantId },
      select: {
        Id: true,
        Nombre: true,
        Dominio: true,
        EstaActivo: true,
        OnboardingCompleto: true,
        EstaEliminado: true,
        PlanId: true,
        Plan: {
          select: {
            Id: true,
            Nombre: true,
            CostoMensual: true,
          },
        },
        Configuraciones: {
          where: { EstaEliminado: false },
          orderBy: { Id: "desc" },
          take: 1,
          select: {
            RazonSocial: true,
            NombreFantasia: true,
            Cuit: true,
            Telefono: true,
            Celular: true,
            Direccion: true,
            Email: true,
            Moneda: true,
            ZonaHoraria: true,
            Forzar2FA: true,
            AfipHabilitado: true,
          },
        },
        _count: {
          select: {
            Usuarios: { where: { EstaEliminado: false } },
            Sucursales: { where: { EstaEliminado: false } },
            Articulos: { where: { EstaEliminado: false } },
            Marcas: { where: { EstaEliminado: false } },
            Rubros: { where: { EstaEliminado: false } },
            Proveedores: { where: { EstaEliminado: false } },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 },
      );
    }

    const config = tenant.Configuraciones[0] || null;

    return NextResponse.json({
      id: Number(tenant.Id),
      nombre: tenant.Nombre,
      dominio: tenant.Dominio,
      estaActivo: tenant.EstaActivo,
      onboardingCompleto: tenant.OnboardingCompleto,
      estaEliminado: tenant.EstaEliminado,
      plan: tenant.Plan
        ? {
            id: Number(tenant.Plan.Id),
            nombre: tenant.Plan.Nombre,
            costoMensual: Number(tenant.Plan.CostoMensual),
          }
        : null,
      configuracion: config
        ? {
            razonSocial: config.RazonSocial,
            nombreFantasia: config.NombreFantasia,
            cuit: config.Cuit,
            telefono: config.Telefono,
            celular: config.Celular,
            direccion: config.Direccion,
            email: config.Email,
            moneda: config.Moneda,
            zonaHoraria: config.ZonaHoraria,
            forzar2FA: config.Forzar2FA,
            afipHabilitado: config.AfipHabilitado,
          }
        : null,
      conteos: {
        usuarios: tenant._count.Usuarios,
        sucursales: tenant._count.Sucursales,
        articulos: tenant._count.Articulos,
        marcas: tenant._count.Marcas,
        rubros: tenant._count.Rubros,
        proveedores: tenant._count.Proveedores,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
