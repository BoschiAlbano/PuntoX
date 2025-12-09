import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { createUnidadMedidaSchema } from "@/lib/validations/unidad-medida.schema";
import { ZodError } from "zod";

export async function GET(_req: NextRequest) {
  // Obtener la session del usuario
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }

  try {
    const unidades = await prisma.unidadMedida.findMany({
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
      {
        unidades: unidades.map((unidad) => ({
          ...unidad,
          Id: Number(unidad.Id),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener unidades de medida:", error);
    return NextResponse.json(
      { error: "Error al obtener unidades de medida" },
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
    const validatedData = createUnidadMedidaSchema.parse(body);

    // Crear la unidad de medida con datos validados
    const unidad = await prisma.unidadMedida.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: tenantId,
      },
    });

    return NextResponse.json(
      {
        ...unidad,
        Id: Number(unidad.Id),
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
      { error: "Error al crear unidad de medida" },
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
  const unidadId = idParam ? Number(idParam) : NaN;

  if (!Number.isInteger(unidadId)) {
    return NextResponse.json(
      { error: "Id de unidad de medida inválido" },
      { status: 400 }
    );
  }

  try {
    const unidadActualizada = await prisma.unidadMedida.delete({
      where: {
        Id: unidadId,
        TenantId: tenantId,
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(unidadActualizada.Id) },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Unidad de medida no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar unidad de medida" },
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
  const unidadId = idParam ? Number(idParam) : NaN;

  if (!Number.isInteger(unidadId)) {
    return NextResponse.json(
      { error: "Id de unidad de medida inválido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    // Validar el body con Zod
    const validatedData = createUnidadMedidaSchema.parse(body);

    // Actualizar la unidad de medida con datos validados
    const unidad = await prisma.unidadMedida.update({
      where: {
        Id: unidadId,
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
        ...unidad,
        Id: Number(unidad.Id),
        TenantId: tenantId,
      },
      { status: 200 }
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
      { error: "Error al actualizar unidad de medida" },
      { status: 500 }
    );
  }
}
