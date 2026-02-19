import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";
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
      permission: PERMISSIONS.PRODUCTOS, // Opcional: Requiere permiso de visualización
    });

    const pagination = parsePaginationParams(req);
    const search = req.nextUrl.searchParams.get("q")?.trim() || "";
    const bajoStock =
      req.nextUrl.searchParams.get("bajoStock")?.toLowerCase() === "true";

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

    if (search) {
      where.OR = [
        { Descripcion: { contains: search, mode: "insensitive" } },
        { CodigoBarra: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtro bajo stock: requiere comparar Stock <= StockMinimo en DB (usa raw)
    let articuloIdsBajoStock: bigint[] = [];
    if (bajoStock) {
      const raw =
        sucursalId && sucursalId !== 0
          ? await prisma.$queryRaw<{ Id: bigint }[]>`
              SELECT a."Id"
              FROM "Articulo" a
              LEFT JOIN "ArticuloStock" ast ON ast."ArticuloId" = a."Id" AND ast."SucursalId" = ${BigInt(sucursalId)}
              WHERE a."TenantId" = ${BigInt(tenantId)}
                AND a."EstaEliminado" = false
                AND (COALESCE(ast."StockMinimo", a."StockMinimo") > 0)
                AND (COALESCE(ast."Stock", 0)::numeric <= COALESCE(ast."StockMinimo", a."StockMinimo")::numeric)
            `
          : await prisma.$queryRaw<{ Id: bigint }[]>`
              SELECT a."Id"
              FROM "Articulo" a
              WHERE a."TenantId" = ${BigInt(tenantId)}
                AND a."EstaEliminado" = false
                AND a."StockMinimo" > 0
                AND a."Stock" <= a."StockMinimo"
            `;
      articuloIdsBajoStock = raw.map((r) => r.Id);
      if (articuloIdsBajoStock.length === 0) {
        return NextResponse.json(
          createPaginationResponse([], 0, pagination),
          { status: 200 },
        );
      }
      (where as Record<string, unknown>).Id = { in: articuloIdsBajoStock };
    }

    // Total: con bajoStock ya tenemos el count (ids.length), evitamos un round-trip extra
    const total = bajoStock
      ? articuloIdsBajoStock.length
      : await prisma.articulo.count({ where });

    // Obtener productos paginados
    const productos = await prisma.articulo.findMany({
      where,
      select: {
        Id: true,
        Codigo: true,
        CodigoBarra: true,
        Descripcion: true,
        EstaEliminado: true,
        Stock: true, // Legacy/Global
        StockMinimo: true,

        Marca: { select: { Descripcion: true } },
        Rubro: { select: { Descripcion: true } },

        // Relacion Precio: Solo lo necesario para la tabla
        Precio: {
          select: {
            PrecioCosto: true,
            PrecioPublico: true,
            PrecioPublico2: true,
          },
        },

        // Stock por sucursal para mostrar correcto
        ArticuloStock: {
          where: {
            SucursalId: BigInt(sucursalId),
          },
          take: 1,
          select: {
            Stock: true,
            StockMinimo: true,
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

    // Mapear productos
    const productosConStock = productos.map((producto) => {
      const stockSucursal =
        sucursalId && Array.isArray(producto.ArticuloStock)
          ? producto.ArticuloStock[0]
          : null;

      return {
        // Campos basicos
        Id: Number(producto.Id),
        Codigo: producto.Codigo,
        CodigoBarra: producto.CodigoBarra,
        Descripcion: producto.Descripcion,
        EstaEliminado: producto.EstaEliminado,

        Marca: producto.Marca ? { Descripcion: producto.Marca.Descripcion } : null,
        Rubro: producto.Rubro ? { Descripcion: producto.Rubro.Descripcion } : null,

        // Stock logic (StockMinimo: sucursal o valor global)
        Stock: stockSucursal ? Number(stockSucursal.Stock) : Number(0),
        StockMinimo: stockSucursal?.StockMinimo != null
          ? Number(stockSucursal.StockMinimo)
          : Number(producto.StockMinimo ?? 0),
        SucursalNombre: stockSucursal?.Sucursal.Nombre || null,

        // Precio
        Precio: {
          PrecioCosto: Number(producto.Precio.PrecioCosto),
          PrecioPublico: Number(producto.Precio.PrecioPublico),
          PrecioPublico2: Number(producto.Precio.PrecioPublico2),
        },
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
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: PERMISSIONS.PRODUCTOS, // Permiso de escritura
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
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: PERMISSIONS.PRODUCTOS, // Permiso de escritura
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
      let precioUpdate = null;

      // 1. Update Price (Only if provided)
      if (validarProducto.Precio) {
        // Build price data dynamically
        const priceData: any = {
          FechaActualizacion: new Date(),
          TenantId: tenantIdBigInt,
        };
        const p = validarProducto.Precio;
        if (p.PrecioCosto !== undefined) priceData.PrecioCosto = p.PrecioCosto;
        if (p.PorcentajeGanancia !== undefined)
          priceData.PorcentajeGanancia = p.PorcentajeGanancia;
        if (p.PrecioPublico !== undefined)
          priceData.PrecioPublico = p.PrecioPublico;
        if (p.PorcentajeGanancia2 !== undefined)
          priceData.PorcentajeGanancia2 = p.PorcentajeGanancia2;
        if (p.PrecioPublico2 !== undefined)
          priceData.PrecioPublico2 = p.PrecioPublico2;

        precioUpdate = await tx.precio.update({
          where: { Id: articulo.Precio.Id },
          data: priceData,
        });
      }

      // 2. Prepare Articulo Update Data
      const articuloData: any = {};

      // Direct fields mapping
      const directFields = [
        "Codigo",
        "CodigoBarra",
        "Abreviatura",
        "Descripcion",
        "Detalle",
        "Ubicacion",
        "ActivarLimiteVenta",
        "LimiteVenta",
        "ActivarHoraVenta",
        "PermiteStockNegativo",
        "DescuentaStock",
        "StockMinimo",
        "VencimientoDias",
        "TipoVenta",
        "EstaEliminado",
      ] as const;

      directFields.forEach((field) => {
        if (validarProducto[field] !== undefined) {
          articuloData[field] = validarProducto[field];
        }
      });

      // Special fields
      if (validarProducto.HoraLimiteVentaDesde !== undefined) {
        articuloData.HoraLimiteVentaDesde = parseTime(
          validarProducto.HoraLimiteVentaDesde,
        );
      }
      if (validarProducto.HoraLimiteVentaHasta !== undefined) {
        articuloData.HoraLimiteVentaHasta = parseTime(
          validarProducto.HoraLimiteVentaHasta,
        );
      }
      // Sync PorcentajeGanancia if Price is updated
      if (validarProducto.Precio?.PorcentajeGanancia !== undefined) {
        articuloData.PorcentajeGanancia =
          validarProducto.Precio.PorcentajeGanancia;
      }

      // Relationships
      if (validarProducto.MarcaId !== undefined)
        articuloData.Marca = { connect: { Id: validarProducto.MarcaId } };
      if (validarProducto.RubroId !== undefined)
        articuloData.Rubro = { connect: { Id: validarProducto.RubroId } };
      if (validarProducto.UnidadMedidaId !== undefined)
        articuloData.UnidadMedida = {
          connect: { Id: validarProducto.UnidadMedidaId },
        };
      if (validarProducto.IvaId !== undefined)
        articuloData.Iva = { connect: { Id: validarProducto.IvaId } };

      let articuloUpdate = null;

      // Only run update if there is data or force check
      if (Object.keys(articuloData).length > 0) {
        articuloUpdate = await tx.articulo.update({
          where: { Id: Number(validarProducto.Id) },
          data: articuloData,
          select: {
            Id: true,
            Codigo: true,
            CodigoBarra: true,
            Descripcion: true,
            Stock: true, // Select current global stock
            Precio: { select: { Id: true, PrecioPublico: true } },
          },
        });
      } else {
        // If no update needed, just return the current state or a minimal object
        articuloUpdate = { Id: Number(validarProducto.Id) };
      }

      // 3. Update ArticuloStock (Sucursal Branch Stock)
      // Only if Stock is provided and SucursalId is available
      if (sucursalId && validarProducto.Stock !== undefined) {
        // Also update StockMinimo/Ubicacion if provided
        await tx.articuloStock.upsert({
          where: {
            ArticuloId_SucursalId: {
              ArticuloId: Number(validarProducto.Id),
              SucursalId: BigInt(sucursalId),
            },
          },
          create: {
            ArticuloId: Number(validarProducto.Id),
            SucursalId: BigInt(sucursalId),
            TenantId: tenantIdBigInt,
            Stock: validarProducto.Stock,
            StockMinimo: validarProducto.StockMinimo ?? null,
            Ubicacion: validarProducto.Ubicacion ?? null,
          },
          update: {
            Stock: validarProducto.Stock,
            ...(validarProducto.StockMinimo !== undefined && {
              StockMinimo: validarProducto.StockMinimo,
            }),
            ...(validarProducto.Ubicacion !== undefined && {
              Ubicacion: validarProducto.Ubicacion,
            }),
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
      permission: PERMISSIONS.PRODUCTOS, // Permiso de eliminación
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
