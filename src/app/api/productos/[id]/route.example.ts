import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";

// GET /api/productos/:id - Obtener un producto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const producto = await prisma.articulo.findUnique({
      where: { Id: id },
      include: {
        Marca: true,
        Rubro: true,
        UnidadMedida: true,
        Iva: true,
        Precio: true,
      },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(producto, { status: 200 });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return NextResponse.json(
      { error: "Error al obtener producto" },
      { status: 500 }
    );
  }
}

// PUT /api/productos/:id - Actualizar un producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    // Verificar que el producto existe
    const productoExistente = await prisma.articulo.findUnique({
      where: { Id: id },
    });

    if (!productoExistente) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el producto
    const productoActualizado = await prisma.articulo.update({
      where: { Id: id },
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
        EstaEliminado: body.EstaEliminado,
      },
      include: {
        Marca: true,
        Rubro: true,
        UnidadMedida: true,
        Iva: true,
        Precio: true,
      },
    });

    return NextResponse.json(productoActualizado, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

// DELETE /api/productos/:id - Eliminar (soft delete) un producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Verificar que el producto existe
    const productoExistente = await prisma.articulo.findUnique({
      where: { Id: id },
    });

    if (!productoExistente) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete - marcar como eliminado
    const productoEliminado = await prisma.articulo.update({
      where: { Id: id },
      data: {
        EstaEliminado: true,
      },
    });

    return NextResponse.json(
      {
        message: "Producto eliminado correctamente",
        producto: productoEliminado,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}
