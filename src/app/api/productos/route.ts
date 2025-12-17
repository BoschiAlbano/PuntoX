import { getAuthUser } from "@/lib/auth/getAuthUser";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import {
  createProductoSchema,
  updateProductoSchema,
} from "@/lib/validations/producto.schema";
import { ZodError } from "zod";
import { parsePaginationParams, createPaginationResponse } from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";

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
      where,
      select: {
        Id: true,
        Codigo: true,
        CodigoBarra: true,
        Descripcion: true,
        DescuentaStock: true,
        PermiteStockNegativo: true,
        Precio: {
          select: {
            PrecioPublico: true,
            PrecioCosto: true,
          },
        },
        Iva: {
          select: {
            Id: true,
            Porcentaje: true,
          },
        },
        Stock: {
          where: {
            EstaEliminado: false,
          },
          select: {
            Cantidad: true,
          },
        },
      },
      orderBy: {
        Descripcion: "asc",
      },
      skip: pagination.skip,
      take: pagination.limit,
    });

    // Serializar BigInt a Number para JSON y validar datos
    const productosSerializados = productos
      .filter((producto) => producto.Precio && producto.Iva) // Filtrar productos sin precio o IVA
      .map((producto) => ({
        Id: Number(producto.Id),
        Codigo: producto.Codigo,
        CodigoBarra: producto.CodigoBarra,
        Descripcion: producto.Descripcion,
        Precio: {
          PrecioPublico: Number(producto.Precio?.PrecioPublico || 0),
          PrecioCosto: Number(producto.Precio?.PrecioCosto || 0),
        },
        Iva: {
          Id: Number(producto.Iva?.Id || 0),
          Porcentaje: Number(producto.Iva?.Porcentaje || 0),
        },
        Stock: (producto.Stock || []).map((stock) => ({
          Cantidad: Number(stock.Cantidad),
        })),
        DescuentaStock: producto.DescuentaStock || false,
        PermiteStockNegativo: producto.PermiteStockNegativo || false,
      }));

    const response = createPaginationResponse(productosSerializados, total, pagination);

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

    const tenantIdBigInt = BigInt(tenantId);

    const precio = await prisma.precio.create({
      data: {
        ArticuloId: 1, // Temporal, se actualizará después
        PrecioCosto: validarProducto.PrecioCosto,
        PorcentajeGanancia: validarProducto.PorcentajeGanancia,
        PrecioPublico: validarProducto.PrecioPublico,
        PorcentajeGanancia2: validarProducto.PorcentajeGanancia2,
        PrecioPublico2: validarProducto.PrecioPublico2,
        FechaActualizacion: new Date(),
        EstaEliminado: false,
        TenantId: tenantIdBigInt,
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
        TenantId: tenantIdBigInt,
        IvaId: BigInt(validarProducto.IvaId),
        Foto: fotoDefault(),
        PrecioId: precio.Id,
        MarcaId: validarProducto.MarcaId,
        RubroId: validarProducto.RubroId,
        UnidadMedidaId: validarProducto.UnidadMedidaId,
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
      throw createError.notFound("Artículo no encontrado o no pertenece a tu tenant");
    }

    // Modificar precio
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
        TenantId: tenantIdBigInt,
      },
    });

    // Modificar artículo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
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
      PrecioId: precio.Id,
    };

    // Agregar campos opcionales solo si están presentes
    if (validarProducto.IvaId !== undefined) {
      updateData.IvaId = BigInt(validarProducto.IvaId);
    }
    if (validarProducto.MarcaId !== undefined) {
      updateData.MarcaId = validarProducto.MarcaId;
    }
    if (validarProducto.RubroId !== undefined) {
      updateData.RubroId = validarProducto.RubroId;
    }
    if (validarProducto.UnidadMedidaId !== undefined) {
      updateData.UnidadMedidaId = validarProducto.UnidadMedidaId;
    }

    const producto = await prisma.articulo.update({
      where: {
        Id: BigInt(validarProducto.Id),
      },
      data: updateData,
    });

    return NextResponse.json(
      {
        producto: {
          ...producto,
          Id: Number(producto.Id),
        },
      },
      { status: 200 }
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
