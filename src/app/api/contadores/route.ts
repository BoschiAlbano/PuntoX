import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { z } from "zod";
import { handleError } from "@/lib/errors/handler";
import {
  SET_PERMISSIONS,
  TIPO_COMPROBANTE_COMPRA,
  TIPO_COMPROBANTE_VENTA,
} from "@/lib/constants/comprobantes";

// Schema para obtener próximo número
const getNextNumberSchema = z.object({
  tipoComprobante: z.number().int().min(1),
});

function getContadorPermission(tipoComprobante: number) {
  const tiposVenta = new Set<number>(Object.values(TIPO_COMPROBANTE_VENTA));
  const tiposCompra = new Set<number>(Object.values(TIPO_COMPROBANTE_COMPRA));

  if (tiposVenta.has(tipoComprobante)) {
    return SET_PERMISSIONS.VENTAS;
  }

  if (tiposCompra.has(tipoComprobante)) {
    return SET_PERMISSIONS.COMPRAS;
  }

  return null;
}

// GET: Obtener próximo número de comprobante
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const tipoComprobanteParam = searchParams.get("tipoComprobante");

    if (!tipoComprobanteParam) {
      return NextResponse.json(
        { error: "tipoComprobante es requerido" },
        { status: 400 },
      );
    }

    const parsed = getNextNumberSchema.safeParse({
      tipoComprobante: Number(tipoComprobanteParam),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "tipoComprobante inválido", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { tipoComprobante } = parsed.data;
    const permission = getContadorPermission(tipoComprobante);

    if (!permission) {
      return NextResponse.json(
        { error: "tipoComprobante no soportado" },
        { status: 400 },
      );
    }

    const { tenantId } = await getAuthContext({
      req,
      permission,
    });

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
      { status: 200 },
    );
  } catch (error) {
    return handleError(error);
  }
}
