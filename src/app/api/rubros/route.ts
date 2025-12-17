import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { createRubroSchema } from "@/lib/validations/rubro.schema";
import { ZodError } from "zod";

export async function GET(_req: NextRequest) {
  // Obtener la session del usuario
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }

  try {
    const rubros = await prisma.rubro.findMany({
      where: {
        TenantId: tenantId,
      },
      select: {
        Id: true,
        Descripcion: true,
        EstaEliminado: true,
      },
      orderBy: {
        Descripcion: "asc",
      },
    });

    return NextResponse.json(
      { rubros: rubros.map((rubro) => ({ ...rubro, Id: Number(rubro.Id) })) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener rubros:", error);
    return NextResponse.json(
      { error: "Error al obtener marcas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }

  try {
    const body = await req.json();

    // Validar el body con Zod
    const validatedData = createRubroSchema.parse(body);

    // Crear la marca con datos validados
    const rubro = await prisma.rubro.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: tenantId,
      },
    });

    return NextResponse.json(
      {
        ...rubro,
        Id: Number(rubro.Id),
        TenantId: tenantId,
      },
      { status: 201 }
    );
  } catch (error) {
    // Manejo de errores de validación de Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear rubro" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }
  const idParam =
    req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
  const rubroId = idParam ? Number(idParam) : NaN;

  // Depuración eliminada: Rubro ID recibido en parámetro

  if (!Number.isInteger(rubroId)) {
    return NextResponse.json(
      { error: "Id de rubro invalido" },
      { status: 400 }
    );
  }

  try {
    const rubroActualizado = await prisma.rubro.delete({
      where: {
        Id: rubroId,
        TenantId: tenantId,
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(rubroActualizado.Id) },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Rubro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar rubro" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }

  const idParam =
    req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
  const rubroId = idParam ? Number(idParam) : NaN;

  if (!Number.isInteger(rubroId)) {
    return NextResponse.json(
      { error: "Id de rubro invalido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    // Validar el body con Zod
    const validatedData = createRubroSchema.parse(body);

    // Crear la marca con datos validados
    const rubro = await prisma.rubro.update({
      where: {
        Id: rubroId,
        TenantId: tenantId,
      },
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: tenantId,
      },
    });

    return NextResponse.json(
      {
        ...rubro,
        Id: Number(rubro.Id),
        TenantId: tenantId,
      },
      { status: 201 }
    );
  } catch (error) {
    // Manejo de errores de validación de Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar rubro" },
      { status: 500 }
    );
  }
}
