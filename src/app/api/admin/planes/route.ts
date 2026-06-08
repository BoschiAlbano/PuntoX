import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";

/**
 * GET /api/admin/planes
 * Lists all SaaS plans with tenant counts (paginated for GenericCrud)
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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (q) {
      where.OR = [
        { Nombre: { contains: q, mode: "insensitive" } },
        { Descripcion: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.planSaaS.findMany({
        where,
        skip,
        take: limit,
        orderBy: { Id: "asc" },
        select: {
          Id: true,
          Nombre: true,
          Descripcion: true,
          CostoMensual: true,
          Caracteristicas: true,
          _count: { select: { Tenants: true } },
        },
      }),
      prisma.planSaaS.count({ where }),
    ]);

    const formatted = data.map((p) => ({
      Id: Number(p.Id),
      Nombre: p.Nombre,
      Descripcion: p.Descripcion || "",
      CostoMensual: Number(p.CostoMensual),
      Caracteristicas: p.Caracteristicas || "",
      CantidadTenants: p._count.Tenants,
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

/**
 * POST /api/admin/planes
 * Creates a new SaaS plan
 */
export async function POST(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { Nombre, Descripcion, CostoMensual, Caracteristicas } = body;

    if (!Nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 },
      );
    }

    // Check unique name
    const existing = await prisma.planSaaS.findUnique({
      where: { Nombre },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un plan con ese nombre" },
        { status: 400 },
      );
    }

    const plan = await prisma.planSaaS.create({
      data: {
        Nombre,
        Descripcion: Descripcion || null,
        CostoMensual: CostoMensual || 0,
        Caracteristicas: Caracteristicas || null,
      },
    });

    return NextResponse.json({
      Id: Number(plan.Id),
      Nombre: plan.Nombre,
      Descripcion: plan.Descripcion || "",
      CostoMensual: Number(plan.CostoMensual),
      Caracteristicas: plan.Caracteristicas || "",
      CantidadTenants: 0,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/admin/planes
 * Updates an existing plan
 */
export async function PATCH(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { Id, Nombre, Descripcion, CostoMensual, Caracteristicas } = body;

    if (!Id) {
      return NextResponse.json(
        { error: "El ID es requerido" },
        { status: 400 },
      );
    }

    // Check unique name if changed
    if (Nombre) {
      const existing = await prisma.planSaaS.findFirst({
        where: {
          Nombre,
          NOT: { Id: BigInt(Id) },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Ya existe otro plan con ese nombre" },
          { status: 400 },
        );
      }
    }

    const plan = await prisma.planSaaS.update({
      where: { Id: BigInt(Id) },
      data: {
        ...(Nombre !== undefined && { Nombre }),
        ...(Descripcion !== undefined && { Descripcion: Descripcion || null }),
        ...(CostoMensual !== undefined && { CostoMensual }),
        ...(Caracteristicas !== undefined && {
          Caracteristicas: Caracteristicas || null,
        }),
      },
      include: {
        _count: { select: { Tenants: true } },
      },
    });

    return NextResponse.json({
      Id: Number(plan.Id),
      Nombre: plan.Nombre,
      Descripcion: plan.Descripcion || "",
      CostoMensual: Number(plan.CostoMensual),
      Caracteristicas: plan.Caracteristicas || "",
      CantidadTenants: plan._count.Tenants,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/admin/planes?Id=X
 * Deletes a plan (only if no tenants are assigned)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const planId = req.nextUrl.searchParams.get("Id");
    if (!planId) {
      return NextResponse.json(
        { error: "El ID es requerido" },
        { status: 400 },
      );
    }

    // Check if plan has tenants
    const plan = await prisma.planSaaS.findUnique({
      where: { Id: BigInt(planId) },
      include: { _count: { select: { Tenants: true } } },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 },
      );
    }

    if (plan._count.Tenants > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: ${plan._count.Tenants} tienda(s) tienen asignado este plan`,
        },
        { status: 400 },
      );
    }

    await prisma.planSaaS.delete({
      where: { Id: BigInt(planId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
