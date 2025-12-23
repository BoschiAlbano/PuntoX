import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { createIvaSchema } from "@/lib/validations/iva.schema";
import { ZodError } from "zod";

export async function GET() {
  // Obtener la session del usuario para asegurar autenticacion
  const { error } = await getAuthUser();

  if (error) {
    return error;
  }

  try {
    const ivas = await prisma.iva.findMany({
      select: {
        Id: true,
        Descripcion: true,
        Porcentaje: true,
        EstaEliminado: true,
      },
      orderBy: {
        Descripcion: "asc",
      },
    });

    return NextResponse.json(
      {
        ivas: ivas.map((iva) => ({
          ...iva,
          Id: Number(iva.Id),
          Porcentaje: Number(iva.Porcentaje),
        })),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error al obtener IVAs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { error } = await getAuthUser();

  if (error) {
    return error;
  }

  try {
    const body = await req.json();

    // Validar el body con Zod
    const validatedData = createIvaSchema.parse(body);

    // Crear el IVA con datos validados
    const iva = await prisma.iva.create({
      data: {
        Descripcion: validatedData.Descripcion,
        Porcentaje: validatedData.Porcentaje,
        EstaEliminado: validatedData.EstaEliminado,
      },
    });

    return NextResponse.json(
      {
        ...iva,
        Id: Number(iva.Id),
        Porcentaje: Number(iva.Porcentaje),
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

    return NextResponse.json({ error: "Error al crear IVA" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await getAuthUser();

  if (error) {
    return error;
  }
  const idParam =
    req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
  const ivaId = idParam ? Number(idParam) : NaN;

  if (!Number.isInteger(ivaId)) {
    return NextResponse.json({ error: "Id de IVA invalido" }, { status: 400 });
  }

  try {
    const ivaActualizado = await prisma.iva.delete({
      where: {
        Id: ivaId,
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(ivaActualizado.Id) },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json({ error: "IVA no encontrado" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Error al eliminar IVA" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { error } = await getAuthUser();

  if (error) {
    return error;
  }

  const idParam =
    req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
  const ivaId = idParam ? Number(idParam) : NaN;

  if (!Number.isInteger(ivaId)) {
    return NextResponse.json({ error: "Id de IVA invalido" }, { status: 400 });
  }

  try {
    const body = await req.json();

    // Validar el body con Zod
    const validatedData = createIvaSchema.parse(body);

    // Actualizar el IVA con datos validados
    const iva = await prisma.iva.update({
      where: {
        Id: ivaId,
      },
      data: {
        Descripcion: validatedData.Descripcion,
        Porcentaje: validatedData.Porcentaje,
        EstaEliminado: validatedData.EstaEliminado,
      },
    });

    return NextResponse.json(
      {
        ...iva,
        Id: Number(iva.Id),
        Porcentaje: Number(iva.Porcentaje),
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
      { error: "Error al actualizar IVA" },
      { status: 500 }
    );
  }
}
