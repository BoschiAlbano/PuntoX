import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { handleError } from "@/lib/errors/handler";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { notificarAdministradores } from "@/lib/notificaciones/notificar";
import { conteoReset, resetearTienda } from "@/lib/tenant/reset";

type Params = { params: Promise<{ id: string }> };

async function tenantDeLaUrl(params: Params["params"]) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return null;
  return prisma.tenant.findUnique({
    where: { Id: BigInt(id) },
    select: { Id: true, Nombre: true },
  });
}

/**
 * GET /api/admin/tenants/[id]/reset
 * Lo que se borraría (para la confirmación). Solo superadmin.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const tenant = await tenantDeLaUrl(params);
    if (!tenant) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }
    return NextResponse.json({
      nombre: tenant.Nombre,
      ...(await conteoReset(tenant.Id)),
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/admin/tenants/[id]/reset
 * Body: { confirmacion: "<nombre exacto del comercio>" }
 *
 * Borra TODOS los movimientos del comercio (ver lib/tenant/reset.ts). Es
 * irreversible: se exige escribir el nombre del comercio. Solo superadmin.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const tenant = await tenantDeLaUrl(params);
    if (!tenant) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const confirmacion = typeof body?.confirmacion === "string" ? body.confirmacion.trim() : "";
    if (confirmacion !== tenant.Nombre.trim()) {
      return NextResponse.json(
        { error: "Para confirmar, escribí exactamente el nombre del comercio." },
        { status: 400 },
      );
    }

    const antes = await conteoReset(tenant.Id);
    const resultado = await resetearTienda(tenant.Id);

    await registrarAuditoria({
      tenantId: tenant.Id,
      usuarioId: auth.usuarioId,
      accion: "RESET_TIENDA",
      detalle: `Reset de tienda por el administrador de PuntoX: ${resultado.comprobantes ?? 0} comprobantes, ${resultado.facturasElectronicas ?? 0} facturas electrónicas, ${resultado.cajas ?? 0} cajas y ${resultado.gastos ?? 0} gastos borrados; stock en cero.`,
      valorAnterior: { ...antes },
      valorNuevo: { ...resultado },
      req,
    });
    await notificarAdministradores(tenant.Id, {
      tipo: "WARNING",
      titulo: "Se reinició la tienda",
      mensaje:
        "El administrador de PuntoX borró todos los movimientos (ventas, compras, cajas, gastos y facturas) y dejó el stock en cero. Los productos, clientes, proveedores y la configuración se conservan.",
      entidadTipo: "RESET_TIENDA",
    });

    return NextResponse.json({ ok: true, resultado });
  } catch (error) {
    return handleError(error);
  }
}
