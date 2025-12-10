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
      include: {
        Precio: true,
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

    const precio = await prisma.precio.create({
      data: {
        ArticuloId: 1,
        PrecioCosto: validarProducto.PrecioCosto,
        PorcentajeGanancia: validarProducto.PorcentajeGanancia,
        PrecioPublico: validarProducto.PrecioPublico,
        PorcentajeGanancia2: validarProducto.PorcentajeGanancia2,
        PrecioPublico2: validarProducto.PrecioPublico2,
        FechaActualizacion: new Date(),
        EstaEliminado: false,
        TenantId: Number(tenantId) || 1,
      },
    });

    const producto = await prisma.articulo.create({
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
        PorcentajeGanancia: validarProducto.PorcentajeGanancia,
        PrecioCosto: validarProducto.PrecioCosto,
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
            Id: precio.Id,
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

    // modificar precio
    const precio = await prisma.precio.update({
      where: {
        Id: articulo.Precio.Id,
      },
      data: {
        PrecioCosto: validarProducto.PrecioCosto,
        PorcentajeGanancia: validarProducto.PorcentajeGanancia,
        PrecioPublico: validarProducto.PrecioPublico,
        PorcentajeGanancia2: validarProducto.PorcentajeGanancia2,
        PrecioPublico2: validarProducto.PrecioPublico2,
        FechaActualizacion: new Date(),
        EstaEliminado: false,
        TenantId: Number(tenantId) || 1,
      },
    });

    // modificar articulo
    const producto = await prisma.articulo.update({
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
        PorcentajeGanancia: validarProducto.PorcentajeGanancia,
        PrecioCosto: validarProducto.PrecioCosto,
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
            Id: precio.Id,
          },
        },
      },
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
