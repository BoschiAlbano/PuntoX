import { getAuthContext } from "@/lib/auth/getAuthUser";
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
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: "productos", // Opcional: Requiere permiso de visualización
    });

    console.log("tenantId", tenantId);
    console.log("sucursalId", sucursalId);

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
        Stock: true, // Stock legacy (deprecated)
        ArticuloStock: {
          where: {
            SucursalId: BigInt(sucursalId),
          },
          take: 1,
          select: {
            Stock: true,
            StockMinimo: true,
            Ubicacion: true,
            Sucursal: {
              select: {
                Nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        Descripcion: "asc",
      },
      skip: pagination.skip,
      take: pagination.limit,
    });

    console.log("productos", productos);

    // Mapear productos para incluir stock de la sucursal activa
    const productosConStock = productos.map((producto) => {
      const stockSucursal =
        sucursalId && Array.isArray(producto.ArticuloStock)
          ? producto.ArticuloStock[0]
          : null;
      return {
        ...producto,
        Stock: producto.ArticuloStock[0]?.Stock || 0,
        StockMinimo: stockSucursal?.StockMinimo
          ? Number(stockSucursal.StockMinimo)
          : producto.StockMinimo
            ? Number(producto.StockMinimo)
            : null,
        Ubicacion: stockSucursal?.Ubicacion || producto.Ubicacion,
        SucursalNombre:
          producto.ArticuloStock[0]?.Sucursal.Nombre || "Sucursal actual",
      };
    });

    const response = createPaginationResponse(
      productosConStock,
      total,
      pagination,
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId, sucursalId, user } = await getAuthContext({
      req,
      permission: "productos", // Permiso de escritura
    });

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
          TenantId: BigInt(tenantId),
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
              Id: BigInt(tenantId),
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

      // 4. Crear ArticuloStock para la sucursal activa
      if (sucursalId && validarProducto.Stock !== undefined) {
        await tx.articuloStock.upsert({
          where: {
            ArticuloId_SucursalId: {
              ArticuloId: nuevoArticulo.Id,
              SucursalId: BigInt(sucursalId),
            },
          },
          create: {
            ArticuloId: nuevoArticulo.Id,
            SucursalId: BigInt(sucursalId),
            TenantId: BigInt(tenantId),
            Stock: validarProducto.Stock,
            StockMinimo: validarProducto.StockMinimo || null,
            Ubicacion: validarProducto.Ubicacion || null,
          },
          update: {
            Stock: validarProducto.Stock,
            StockMinimo: validarProducto.StockMinimo || null,
            Ubicacion: validarProducto.Ubicacion || null,
          },
        });
      }

      return nuevoArticulo;
    });

    return NextResponse.json(
      {
        producto: {
          ...producto,
          Id: Number(producto.Id),
        },
      },
      { status: 201 },
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
        { status: 400 },
      );
    }
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, sucursalId, user } = await getAuthContext({
      req,
      permission: "productos", // Permiso de escritura
    });

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
        "Artículo no encontrado o no pertenece a tu tenant",
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
          TenantId: tenantIdBigInt,
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
              Id: tenantIdBigInt,
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
          Precio: {
            select: {
              Id: true,
              PrecioCosto: true,
              PorcentajeGanancia: true,
              PrecioPublico: true,
              PorcentajeGanancia2: true,
              PrecioPublico2: true,
              FechaActualizacion: true,
            },
          },
          Stock: true,
        },
      });

      // Actualizar o crear ArticuloStock para la sucursal activa
      if (sucursalId && validarProducto.Stock !== undefined) {
        await tx.articuloStock.upsert({
          where: {
            ArticuloId_SucursalId: {
              ArticuloId: articuloUpdate.Id,
              SucursalId: BigInt(sucursalId),
            },
          },
          create: {
            ArticuloId: articuloUpdate.Id,
            SucursalId: BigInt(sucursalId),
            TenantId: tenantIdBigInt,
            Stock: validarProducto.Stock,
            StockMinimo: validarProducto.StockMinimo || null,
            Ubicacion: validarProducto.Ubicacion || null,
          },
          update: {
            Stock: validarProducto.Stock,
            StockMinimo: validarProducto.StockMinimo || null,
            Ubicacion: validarProducto.Ubicacion || null,
          },
        });
      }

      return articuloUpdate;
    });

    return NextResponse.json(
      {
        producto: {
          ...producto,
        },
      },
      { status: 201 },
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
        { status: 400 },
      );
    }
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: "productos", // Permiso de eliminación
    });

    const params = req.nextUrl.searchParams;
    const Id = params.get("Id");

    const articulo = await prisma.articulo.delete({
      where: {
        Id: Number(Id),
        TenantId: BigInt(tenantId),
      },
    });

    return NextResponse.json(
      {
        producto: {
          ...articulo,
        },
      },
      { status: 201 },
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
        { status: 400 },
      );
    }
    return handleError(error);
  }
}

function parseTime(timeString?: string | null): Date {
  if (!timeString) return new Date(); // Fecha actual por defecto si no hay hora

  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}
