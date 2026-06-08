import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";

/**
 * GET /api/admin/auditoria
 * Cross-tenant audit log for SuperAdmin
 */
export async function GET(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const tenantIdFilter = searchParams.get("tenantId");
    const severidadFilter = searchParams.get("severidad");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (tenantIdFilter) {
      where.TenantId = BigInt(tenantIdFilter);
    }

    if (severidadFilter && severidadFilter !== "todos") {
      where.Severidad = severidadFilter;
    }

    if (q) {
      where.OR = [
        { Accion: { contains: q, mode: "insensitive" } },
        { Detalle: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.auditoriaEmpleado.findMany({
        where,
        skip,
        take: limit,
        orderBy: { Fecha: "desc" },
        select: {
          Id: true,
          Fecha: true,
          Accion: true,
          Detalle: true,
          Severidad: true,
          IpAddress: true,
          Tenant: {
            select: {
              Id: true,
              Nombre: true,
            },
          },
          Usuario: {
            select: {
              Nombre: true,
            },
          },
          UsuarioAfectado: {
            select: {
              Nombre: true,
            },
          },
        },
      }),
      prisma.auditoriaEmpleado.count({ where }),
    ]);

    const formatted = data.map((a) => ({
      Id: Number(a.Id),
      Fecha: a.Fecha,
      Accion: a.Accion,
      Detalle: a.Detalle || "",
      Severidad: a.Severidad,
      IpAddress: a.IpAddress || "",
      TenantNombre: a.Tenant.Nombre,
      TenantId: Number(a.Tenant.Id),
      UsuarioNombre: a.Usuario.Nombre,
      UsuarioAfectado: a.UsuarioAfectado?.Nombre || "",
    }));

    return NextResponse.json({
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
