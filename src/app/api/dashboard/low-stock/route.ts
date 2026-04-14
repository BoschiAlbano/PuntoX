import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: PERMISSIONS.ANALITICAS,
    });

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Sucursal no especificada" },
        { status: 400 }
      );
    }

    const tenantIdBigInt = BigInt(tenantId);
    const sucursalIdBigInt = BigInt(sucursalId);

    // Using raw query to compare columns (Stock <= StockMinimo)
    // Since ArticuloStock.StockMinimo can be null and inherit from Articulo, we coalesce.
    const lowStockItems = await prisma.$queryRaw`
      SELECT 
        a."Id" as "ArticuloId",
        a."Descripcion" as "ArticuloNombre",
        a."CodigoBarra",
        ast."Stock",
        COALESCE(ast."StockMinimo", a."StockMinimo", 0) as "StockMinimo",
        s."Nombre" as "SucursalNombre"
      FROM "ArticuloStock" ast
      JOIN "Articulo" a ON ast."ArticuloId" = a."Id"
      JOIN "Sucursal" s ON ast."SucursalId" = s."Id"
      WHERE ast."TenantId" = ${tenantIdBigInt}
        AND ast."SucursalId" = ${sucursalIdBigInt}
        AND a."EstaEliminado" = false
        AND ast."Stock" <= COALESCE(ast."StockMinimo", a."StockMinimo", 0)
      ORDER BY ast."Stock" ASC
      LIMIT 50
    `;

    // Process raw array mapping BigInts to strings/numbers to avoid JSON serialization errors
    const processedItems = (lowStockItems as any[]).map((item) => ({
      id: item.ArticuloId.toString(),
      name: item.ArticuloNombre,
      barcode: item.CodigoBarra,
      stock: Number(item.Stock),
      minStock: Number(item.StockMinimo),
      branch: item.SucursalNombre,
    }));

    return NextResponse.json({
      lowStockItems: processedItems,
      totalCount: processedItems.length
    });
  } catch (error) {
    return handleError(error);
  }
}
