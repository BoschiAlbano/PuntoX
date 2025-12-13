import { getAuthUser } from "@/lib/auth/getAuthUser";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import {
  createProductoSchema,
  updateProductoSchema,
} from "@/lib/validations/producto.schema";
import { ZodError } from "zod";

export async function GET(_req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const productos = await prisma.articulo.findMany({
      where: {
        TenantId: tenantId,
      },
      select: {
        Id: true,
        MarcaId: true,
        RubroId: true,
        UnidadMedidaId: true,
        IvaId: true,
        PrecioId: true,
        Codigo: true,
        CodigoBarra: true,
        Abreviatura: true,
        Descripcion: true,
        Detalle: true,
        Ubicacion: true,
        PrecioCosto: true,
        PorcentajeGanancia: true,
        // Foto: excluded to improve performance
        ActivarLimiteVenta: true,
        LimiteVenta: true,
        ActivarHoraVenta: true,
        HoraLimiteVentaDesde: true,
        HoraLimiteVentaHasta: true,
        PermiteStockNegativo: true,
        DescuentaStock: true,
        StockMinimo: true,
        VencimientoDias: true,
        TipoVenta: true,
        EstaEliminado: true,
        TenantId: true,
        Precio: true, // Equivalent to include: { Precio: true }
      },
      orderBy: {
        Descripcion: "asc",
      },
    });

    return NextResponse.json(
      {
        productos,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const body = await req.json();

    const validarProducto = createProductoSchema.parse(body);

    // Iniciar transacción para crear Precio y Artículo
    const producto = await prisma.$transaction(async (tx) => {
      // 1. Crear Precio primero (con ArticuloId temporal 0 o 1)
      const nuevoPrecio = await tx.precio.create({
        data: {
          ArticuloId: 0, // Se actualizará al final
          PrecioCosto: validarProducto.Precio.PrecioCosto,
          PorcentajeGanancia: validarProducto.Precio.PorcentajeGanancia,
          PrecioPublico: validarProducto.Precio.PrecioPublico,
          PorcentajeGanancia2: validarProducto.Precio.PorcentajeGanancia2,
          PrecioPublico2: validarProducto.Precio.PrecioPublico2,
          FechaActualizacion: new Date(),
          EstaEliminado: false,
          TenantId: Number(tenantId) || 1,
        },
      });

      // 2. Crear Artículo relacionado con el Precio creado
      const nuevoArticulo = await tx.articulo.create({
        data: {
          ActivarHoraVenta: validarProducto.ActivarHoraVenta,
          ActivarLimiteVenta: validarProducto.ActivarLimiteVenta,
          Codigo: validarProducto.Codigo,
          CodigoBarra: validarProducto.CodigoBarra,
          Abreviatura: validarProducto.Abreviatura,
          Descripcion: validarProducto.Descripcion,
          Detalle: validarProducto.Detalle,
          DescuentaStock: validarProducto.DescuentaStock,
          EstaEliminado: validarProducto.EstaEliminado,
          HoraLimiteVentaDesde: parseTime(validarProducto.HoraLimiteVentaDesde),
          HoraLimiteVentaHasta: parseTime(validarProducto.HoraLimiteVentaHasta),
          LimiteVenta: validarProducto.LimiteVenta,
          PermiteStockNegativo: validarProducto.PermiteStockNegativo,
          StockMinimo: validarProducto.StockMinimo,
          VencimientoDias: validarProducto.VencimientoDias,
          TipoVenta: validarProducto.TipoVenta,
          // Redundancia en Articulo
          PorcentajeGanancia: validarProducto.Precio.PorcentajeGanancia,
          PrecioCosto: validarProducto.Precio.PrecioCosto,
          Ubicacion: validarProducto.Ubicacion,
          Tenant: {
            connect: {
              Id: Number(tenantId) || 1,
            },
          },
          Iva: {
            connect: {
              Id: validarProducto.IvaId,
            },
          },
          Foto: fotoDefault(),
          Precio: {
            connect: {
              Id: nuevoPrecio.Id,
            },
          },
          Marca: {
            connect: {
              Id: validarProducto.MarcaId,
            },
          },
          Rubro: {
            connect: {
              Id: validarProducto.RubroId,
            },
          },
          UnidadMedida: {
            connect: {
              Id: validarProducto.UnidadMedidaId,
            },
          },
        },
        include: {
          Precio: true,
        },
      });

      // 3. Actualizar Precio con el ID correcto del Artículo
      await tx.precio.update({
        where: { Id: nuevoPrecio.Id },
        data: { ArticuloId: nuevoArticulo.Id },
      });

      return nuevoArticulo;
    });

    return NextResponse.json(
      {
        producto: {
          ...producto,
          Id: Number(producto.Id),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
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
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const body = await req.json();

    console.log(body);

    const validarProducto = updateProductoSchema.parse(body);

    // buscar articulo
    const articulo = await prisma.articulo.findUnique({
      where: {
        Id: Number(validarProducto.Id),
      },
      include: {
        Precio: true,
      },
    });

    if (!articulo) {
      return NextResponse.json(
        { error: "Articulo no encontrado" },
        { status: 404 }
      );
    }

    const producto = await prisma.$transaction(async (tx) => {
      const precioUpdate = await tx.precio.update({
        where: {
          Id: articulo.Precio.Id,
        },
        data: {
          PrecioCosto: validarProducto.Precio.PrecioCosto,
          PorcentajeGanancia: validarProducto.Precio.PorcentajeGanancia,
          PrecioPublico: validarProducto.Precio.PrecioPublico,
          PorcentajeGanancia2: validarProducto.Precio.PorcentajeGanancia2,
          PrecioPublico2: validarProducto.Precio.PrecioPublico2,
          FechaActualizacion: new Date(),
          EstaEliminado: false,
          TenantId: Number(tenantId) || 1,
        },
      });

      const articuloUpdate = await tx.articulo.update({
        where: {
          Id: Number(validarProducto.Id),
        },
        data: {
          Id: Number(validarProducto.Id),
          Codigo: validarProducto.Codigo,
          CodigoBarra: validarProducto.CodigoBarra,
          Abreviatura: validarProducto.Abreviatura,
          Descripcion: validarProducto.Descripcion,
          Detalle: validarProducto.Detalle,
          DescuentaStock: validarProducto.DescuentaStock,
          EstaEliminado: validarProducto.EstaEliminado,
          HoraLimiteVentaDesde: parseTime(validarProducto.HoraLimiteVentaDesde),
          HoraLimiteVentaHasta: parseTime(validarProducto.HoraLimiteVentaHasta),
          LimiteVenta: validarProducto.LimiteVenta,
          PermiteStockNegativo: validarProducto.PermiteStockNegativo,
          StockMinimo: validarProducto.StockMinimo,
          VencimientoDias: validarProducto.VencimientoDias,
          TipoVenta: validarProducto.TipoVenta,
          PorcentajeGanancia: validarProducto.Precio.PorcentajeGanancia,
          PrecioCosto: validarProducto.Precio.PrecioCosto,
          Ubicacion: validarProducto.Ubicacion,
          Tenant: {
            connect: {
              Id: Number(tenantId) || 1,
            },
          },
          Iva: {
            connect: {
              Id: validarProducto.IvaId,
            },
          },
          Marca: {
            connect: {
              Id: validarProducto.MarcaId,
            },
          },
          Rubro: {
            connect: {
              Id: validarProducto.RubroId,
            },
          },
          UnidadMedida: {
            connect: {
              Id: validarProducto.UnidadMedidaId,
            },
          },
          Precio: {
            connect: {
              Id: precioUpdate.Id,
            },
          },
        },
        include: {
          Precio: true,
        },
      });

      return articuloUpdate;
    });

    return NextResponse.json(
      {
        producto: {
          ...producto,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
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
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const params = req.nextUrl.searchParams;
    const Id = params.get("Id");

    const articulo = await prisma.articulo.delete({
      where: {
        Id: Number(Id),
        TenantId: Number(tenantId),
      },
    });

    return NextResponse.json(
      {
        producto: {
          ...articulo,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
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
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}

function fotoDefault(): Uint8Array<ArrayBufferLike> {
  return Buffer.from("/productodefecto.jpg", "base64");
}

function parseTime(timeString?: string | null): Date {
  if (!timeString) return new Date(); // Fecha actual por defecto si no hay hora

  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}
