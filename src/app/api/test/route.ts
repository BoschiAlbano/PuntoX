import { NextRequest, NextResponse } from "next/server";

import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, user, sucursalId } = await getAuthContext({
      req,
      permission: PERMISSIONS.PRODUCTOS, // Permiso compartido
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 403 },
      );
    }

    // const tenantId = "2";
    // const sucursalId = "2";

    const where: any = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
    };

    //consulta
    const response = await prisma.articulo.findMany({
      where,
      select: {
        Id: true,
        Codigo: true,
        CodigoBarra: true,
        Descripcion: true,
        // Reglas de negocio
        DescuentaStock: true,
        PermiteStockNegativo: true,
        StockMinimo: true,

        ActivarLimiteVenta: true,
        LimiteVenta: true,

        ActivarHoraVenta: true,
        HoraLimiteVentaDesde: true,
        HoraLimiteVentaHasta: true,

        TipoVenta: true,
        // Stock global (fallback)
        Stock: true,

        // Precios
        PrecioCosto: true,
        Precios: {
          select: {
            PrecioFinal: true,
            ListaPrecioId: true,
          },
        },

        Iva: {
          select: {
            Id: true,
            Porcentaje: true,
            Descripcion: true,
          },
        },
        // Stock especifico de sucursal
        ArticuloStock: {
          where: { SucursalId: BigInt(sucursalId) },
          select: { Stock: true, StockMinimo: true, Ubicacion: true },
          take: 1,
        },
      },
      orderBy: { Descripcion: "asc" },
      take: 10,
      skip: 0,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return console.error(error);
  }
}
