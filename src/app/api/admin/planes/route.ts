import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { parsePlanFeatures, serializarPlanFeatures } from "@/lib/planes/features";
import { createPlanSchema, updatePlanSchema } from "@/lib/validations/planSaas.schema";

/** Forma en que la API devuelve un plan: los límites ya parseados. */
function aRespuesta(p: {
  Id: bigint;
  Nombre: string;
  Descripcion: string | null;
  CostoMensual: unknown;
  Caracteristicas: string | null;
  _count?: { Tenants: number };
}) {
  return {
    Id: Number(p.Id),
    Nombre: p.Nombre,
    Descripcion: p.Descripcion || "",
    CostoMensual: Number(p.CostoMensual),
    Limites: parsePlanFeatures(p.Caracteristicas),
    CantidadTenants: p._count?.Tenants ?? 0,
  };
}

/** Primer mensaje de error de Zod, para mostrarlo en el formulario. */
const errorValidacion = (issues: { message: string }[]) =>
  NextResponse.json({ error: issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

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
        // Del más barato al más caro (Básico → Intermedio → Pro)
        orderBy: [{ CostoMensual: "asc" }, { Id: "asc" }],
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

    const formatted = data.map(aRespuesta);

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
 * Crea un plan. Body: { Nombre, Descripcion?, CostoMensual, Limites }.
 * Los límites se validan con Zod (antes eran texto libre: un JSON mal
 * escrito dejaba el plan sin ningún límite).
 */
export async function POST(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const parsed = createPlanSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorValidacion(parsed.error.issues);
    const { Nombre, Descripcion, CostoMensual, Limites } = parsed.data;

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
        CostoMensual,
        Caracteristicas: serializarPlanFeatures(Limites),
      },
    });

    return NextResponse.json(aRespuesta(plan));
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/admin/planes
 * Actualiza un plan (mismos campos que POST, todos opcionales salvo Id).
 */
export async function PATCH(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const parsed = updatePlanSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorValidacion(parsed.error.issues);
    const { Id, Nombre, Descripcion, CostoMensual, Limites } = parsed.data;

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
        ...(Limites !== undefined && {
          Caracteristicas: serializarPlanFeatures(Limites),
        }),
      },
      include: {
        _count: { select: { Tenants: true } },
      },
    });

    return NextResponse.json(aRespuesta(plan));
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
