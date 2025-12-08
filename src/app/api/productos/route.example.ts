/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";

// GET /api/productos - Listar todos los productos
export async function GET() {
  try {
    const productos = await prisma.articulo.findMany({
      where: {
        EstaEliminado: false,
      },
      include: {
        Marca: true,
        Rubro: true,
        UnidadMedida: true,
        Iva: true,
        Precio: true,
      },
      orderBy: {
        Id: "desc",
      },
    });

    return NextResponse.json(productos, { status: 200 });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

// POST /api/productos - Crear un nuevo producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validaciones básicas
    if (!body.Descripcion || !body.CodigoBarra) {
      return NextResponse.json(
        { error: "Descripción y Código de Barras son obligatorios" },
        { status: 400 }
      );
    }

    // Crear el producto
    const nuevoProducto = await prisma.articulo.create({
      data: {
        MarcaId: body.MarcaId,
        RubroId: body.RubroId,
        UnidadMedidaId: body.UnidadMedidaId,
        IvaId: body.IvaId,
        PrecioId: body.PrecioId,
        Codigo: body.Codigo,
        CodigoBarra: body.CodigoBarra,
        Abreviatura: body.Abreviatura || null,
        Descripcion: body.Descripcion,
        Detalle: body.Detalle || null,
        Ubicacion: body.Ubicacion || null,
        PrecioCosto: body.PrecioCosto,
        PorcentajeGanancia: body.PorcentajeGanancia,
        Foto: Buffer.from([]), // Por ahora vacío, implementar carga de imágenes después
        ActivarLimiteVenta: body.ActivarLimiteVenta,
        LimiteVenta: body.LimiteVenta,
        ActivarHoraVenta: body.ActivarHoraVenta,
        HoraLimiteVentaDesde: new Date(
          `1970-01-01T${body.HoraLimiteVentaDesde}:00`
        ),
        HoraLimiteVentaHasta: new Date(
          `1970-01-01T${body.HoraLimiteVentaHasta}:00`
        ),
        PermiteStockNegativo: body.PermiteStockNegativo,
        DescuentaStock: body.DescuentaStock,
        StockMinimo: body.StockMinimo,
        VencimientoDias: body.VencimientoDias,
        TipoVenta: body.TipoVenta,
        EstaEliminado: body.EstaEliminado || false,
      },
      include: {
        Marca: true,
        Rubro: true,
        UnidadMedida: true,
        Iva: true,
        Precio: true,
      },
    });

    return NextResponse.json(nuevoProducto, { status: 201 });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}
