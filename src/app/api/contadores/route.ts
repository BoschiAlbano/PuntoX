import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { z } from "zod";

// Schema para obtener próximo número
const getNextNumberSchema = z.object({
  tipoComprobante: z.number().int().min(1),
});

// GET: Obtener próximo número de comprobante
export async function GET(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const searchParams = req.nextUrl.searchParams;
    const tipoComprobanteParam = searchParams.get("tipoComprobante");

    if (!tipoComprobanteParam) {
      return NextResponse.json(
        { error: "tipoComprobante es requerido" },
        { status: 400 }
      );
    }

    const parsed = getNextNumberSchema.safeParse({
      tipoComprobante: Number(tipoComprobanteParam),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "tipoComprobante inválido", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { tipoComprobante } = parsed.data;
    const tenantIdBigInt = BigInt(tenantId);

    // Buscar contador existente
    let contador = await prisma.contador.findFirst({
      where: {
        TenantId: tenantIdBigInt,
        TipoComprobante: tipoComprobante,
        EstaEliminado: false,
      },
    });

    // Si no existe, crear uno nuevo con valor inicial 1
    if (!contador) {
      contador = await prisma.contador.create({
        data: {
          TenantId: tenantIdBigInt,
          TipoComprobante: tipoComprobante,
          Valor: 1,
          EstaEliminado: false,
        },
      });
    }

    // Incrementar y actualizar el contador en una transacción
    const contadorActualizado = await prisma.contador.update({
      where: { Id: contador.Id },
      data: {
        Valor: { increment: 1 },
      },
    });

    return NextResponse.json(
      {
        numero: contadorActualizado.Valor,
        tipoComprobante: tipoComprobante,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener próximo número", error);
    return NextResponse.json(
      { error: "Error al obtener próximo número de comprobante" },
      { status: 500 }
    );
  }
}


