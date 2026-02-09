import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";
import { z } from "zod";
import { ZodError } from "zod";
import { handleError } from "@/lib/errors/handler";

const createConceptoGastoSchema = z.object({
  Descripcion: z.string().min(1, "La descripción es requerida"),
  EstaEliminado: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    permission: PERMISSIONS.CAJA, // Mismo permiso que productos por coherencia
  });

  try {
    const conceptos = await prisma.conceptoGastos.findMany({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
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
        conceptosGasto: conceptos.map((concepto) => ({
          ...concepto,
          Id: Number(concepto.Id),
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    permission: PERMISSIONS.CAJA, // Mismo permiso que productos por coherencia
  });

  try {
    const body = await req.json();
    const validatedData = createConceptoGastoSchema.parse(body);

    const concepto = await prisma.conceptoGastos.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: BigInt(tenantId),
      },
    });

    return NextResponse.json(
      {
        ...concepto,
        Id: Number(concepto.Id),
        TenantId: tenantId,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    return handleError(error);
  }
}
