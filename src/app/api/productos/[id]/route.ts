import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";
import { getArticuloFoto } from "@/lib/services/productos";

/**
 * GET /api/productos/[id]
 * - Sin query: devuelve el producto completo en JSON (para formulario/edición)
 * - Con ?foto=1: devuelve la imagen del producto (JPEG/PNG)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PRODUCTOS,
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
        Precios: {
          include: {
            ListaPrecio: { select: { Nombre: true } },
          },
        },
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

      PrecioCosto: Number(producto.PrecioCosto),
      PreciosLista: producto.Precios?.map((pl: { Id: bigint; ListaPrecioId: bigint; PrecioFinal: unknown; PorcentajeGanancia: unknown; ListaPrecio?: { Nombre: string } | null }) => ({
        Id: Number(pl.Id),
        ListaPrecioId: Number(pl.ListaPrecioId),
        PrecioFinal: Number(pl.PrecioFinal),
        PorcentajeGanancia: Number(pl.PorcentajeGanancia),
        ListaPrecio: {
          Nombre: pl.ListaPrecio?.Nombre,
        }
      })) || [],

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
      Foto: producto.Foto, // Ya es un string de Supabase
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
