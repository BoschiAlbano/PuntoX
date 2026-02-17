import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: PERMISSIONS.PRODUCTOS,
    });

    if (!id) {
      throw createError.validation("ID requerido");
    }

    const producto = await prisma.articulo.findFirst({
      where: {
        Id: Number(id),
        TenantId: BigInt(tenantId),
      },
      include: {
        Precio: true,
        Marca: { select: { Descripcion: true } },
        Rubro: { select: { Descripcion: true } },
        UnidadMedida: { select: { Descripcion: true } },
        Iva: { select: { Descripcion: true, Porcentaje: true } },
        ArticuloStock: {
          where: {
            SucursalId: BigInt(sucursalId),
          },
          take: 1,
          include: {
            Sucursal: {
              select: { Nombre: true },
            },
          },
        },
      },
    });

    if (!producto) {
      throw createError.notFound("Producto no encontrado");
    }

    // Mapeo (Similar al que tenías antes pero para un solo item)
    const stockSucursal = producto.ArticuloStock[0];

    // Construimos el objeto completo que espera el formulario
    // Convertimos BigInts y fechas si es necesario
    const response = {
      ...producto,
      Id: Number(producto.Id),

      // Stock: Priorizamos el de la sucursal
      Precio: {
        Id: Number(producto.Precio.Id),
        ArticuloId: Number(producto.Precio.ArticuloId),
        PrecioCosto: Number(producto.Precio.PrecioCosto),
        PorcentajeGanancia: Number(producto.Precio.PorcentajeGanancia),
        PrecioPublico: Number(producto.Precio.PrecioPublico),
        PorcentajeGanancia2: Number(producto.Precio.PorcentajeGanancia2),
        PrecioPublico2: Number(producto.Precio.PrecioPublico2),
        FechaActualizacion: producto.Precio.FechaActualizacion,
      },

      // Hora en formato HH:mm:ss
      HoraLimiteVentaDesde: producto.HoraLimiteVentaDesde
        ? [
            producto.HoraLimiteVentaDesde.getHours()
              .toString()
              .padStart(2, "0"),
            producto.HoraLimiteVentaDesde.getMinutes()
              .toString()
              .padStart(2, "0"),
            producto.HoraLimiteVentaDesde.getSeconds()
              .toString()
              .padStart(2, "0"),
          ].join(":")
        : null,
      HoraLimiteVentaHasta: producto.HoraLimiteVentaHasta
        ? [
            producto.HoraLimiteVentaHasta.getHours()
              .toString()
              .padStart(2, "0"),
            producto.HoraLimiteVentaHasta.getMinutes()
              .toString()
              .padStart(2, "0"),
            producto.HoraLimiteVentaHasta.getSeconds()
              .toString()
              .padStart(2, "0"),
          ].join(":")
        : null,

      ActivarLimiteVenta: producto.ActivarLimiteVenta,
      LimiteVenta: Number(producto.LimiteVenta),

      StockMinimo: stockSucursal?.StockMinimo
        ? Number(stockSucursal.StockMinimo)
        : Number(producto.StockMinimo),

      Stock: stockSucursal ? Number(stockSucursal.Stock) : Number(0),
      SucursalNombre: stockSucursal?.Sucursal?.Nombre ?? null,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
