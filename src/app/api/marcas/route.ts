import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { createMarcaSchema } from "@/lib/validations/marca.schema";
import { ZodError } from "zod";

export async function GET() {
  // Obtener la session del usuario
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }

  try {
    const marcas = await prisma.marca.findMany({
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
      { marcas: marcas.map((marca) => ({ ...marca, Id: Number(marca.Id) })) },
      { status: 200 }
    );
  } catch {
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
    const validatedData = createMarcaSchema.parse(body);

    // Crear la marca con datos validados
    const marca = await prisma.marca.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: tenantId,
      },
    });

    return NextResponse.json(
      {
        ...marca,
        Id: Number(marca.Id),
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
      { error: "Error al crear marca" },
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
  const marcaId = idParam ? Number(idParam) : NaN;

  console.log("Marca ID:", marcaId);

  if (!Number.isInteger(marcaId)) {
    return NextResponse.json(
      { error: "Id de marca invalido" },
      { status: 400 }
    );
  }

  try {
    const marcaActualizada = await prisma.marca.delete({
      where: {
        Id: marcaId,
        TenantId: tenantId,
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(marcaActualizada.Id) },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar marca" },
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
  const marcaId = idParam ? Number(idParam) : NaN;

  if (!Number.isInteger(marcaId)) {
    return NextResponse.json(
      { error: "Id de marca invalido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    // Validar el body con Zod
    const validatedData = createMarcaSchema.parse(body);

    // Crear la marca con datos validados
    const marca = await prisma.marca.update({
      where: {
        Id: marcaId,
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
        ...marca,
        Id: Number(marca.Id),
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
      { error: "Error al actualizar marca" },
      { status: 500 }
    );
  }
}
