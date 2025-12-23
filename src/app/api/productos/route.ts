import { getAuthUser } from "@/lib/auth/getAuthUser";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import {
  createProductoSchema,
  updateProductoSchema,
} from "@/lib/validations/producto.schema";
import { ZodError } from "zod";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";
import { fotoDefault } from "@/utilities/fotoDefault";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const pagination = parsePaginationParams(req);
    const search = req.nextUrl.searchParams.get("q")?.trim() || "";

    // Construir where clause
    const where: {
      TenantId: bigint;
      EstaEliminado: boolean;
      OR?: Array<{
        Descripcion?: { contains: string; mode: "insensitive" };
        CodigoBarra?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
    };

    // Agregar búsqueda si existe
    if (search) {
      where.OR = [
        { Descripcion: { contains: search, mode: "insensitive" } },
        { CodigoBarra: { contains: search, mode: "insensitive" } },
      ];
    }

    // Obtener total para paginación
    const total = await prisma.articulo.count({ where });

    // Obtener productos paginados
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
        Stock: true,
      },
      orderBy: {
        Descripcion: "asc",
      },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const response = createPaginationResponse(productos, total, pagination);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    // Validar tenantId - NO permitir fallbacks
    if (!tenantId || tenantId <= 0) {
      throw createError.unauthorized("TenantId inválido o no proporcionado");
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
          Ubicacion: validarProducto.Ubicacion,
          Stock: validarProducto.Stock,
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
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    // Validar tenantId - NO permitir fallbacks
    if (!tenantId || tenantId <= 0) {
      throw createError.unauthorized("TenantId inválido o no proporcionado");
    }

    const body = await req.json();

    const validarProducto = updateProductoSchema.parse(body);

    const tenantIdBigInt = BigInt(tenantId);

    // Buscar artículo y validar que pertenece al tenant
    const articulo = await prisma.articulo.findFirst({
      where: {
        Id: BigInt(validarProducto.Id),
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      include: {
        Precio: true,
      },
    });

    if (!articulo) {
      throw createError.notFound(
        "Artículo no encontrado o no pertenece a tu tenant"
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
          Ubicacion: validarProducto.Ubicacion,
          Stock: validarProducto.Stock,
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

function parseTime(timeString?: string | null): Date {
  if (!timeString) return new Date(); // Fecha actual por defecto si no hay hora

  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}
