import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
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
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PRODUCTOS, // Opcional: Requiere permiso de visualización
    });

    const pagination = parsePaginationParams(req);
    const search = req.nextUrl.searchParams.get("q")?.trim() || "";
    const bajoStock =
      req.nextUrl.searchParams.get("bajoStock")?.toLowerCase() === "true";

    // Construir where clause
    const where: {
      TenantId: bigint;
      // EstaEliminado: boolean;
      OR?: Array<{
        Descripcion?: { contains: string; mode: "insensitive" };
        CodigoBarra?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      TenantId: BigInt(tenantId),
      // EstaEliminado: false,
    };

    // Agregar búsqueda si existe
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
        return NextResponse.json(createPaginationResponse([], 0, pagination), {
          status: 200,
        });
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
        StockMinimo: true,
        PrecioCosto: true,
        Foto: true,

        Marca: { select: { Descripcion: true } },
        Rubro: { select: { Descripcion: true } },

        // Relación Precios
        Precios: {
          select: {
            ListaPrecioId: true,
            PorcentajeGanancia: true,
            PrecioFinal: true,
            ListaPrecio: { select: { Nombre: true } },
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
        Foto: producto.Foto,

        Marca: producto.Marca
          ? { Descripcion: producto.Marca.Descripcion }
          : null,
        Rubro: producto.Rubro
          ? { Descripcion: producto.Rubro.Descripcion }
          : null,

        // Stock logic (StockMinimo: sucursal o valor global)
        Stock: stockSucursal ? Number(stockSucursal.Stock) : Number(0),
        StockMinimo:
          stockSucursal?.StockMinimo != null
            ? Number(stockSucursal.StockMinimo)
            : Number(producto.StockMinimo ?? 0),
        SucursalNombre: stockSucursal?.Sucursal.Nombre || null,
        // Precios
        PrecioCosto: Number(producto.PrecioCosto || 0),
        PreciosLista: producto.Precios.map((p) => ({
          ListaPrecioId: Number(p.ListaPrecioId),
          PorcentajeGanancia: Number(p.PorcentajeGanancia),
          PrecioFinal: Number(p.PrecioFinal),
          ListaPrecio: p.ListaPrecio ? { Nombre: p.ListaPrecio.Nombre } : undefined,
        })),
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
      permission: SET_PERMISSIONS.PRODUCTOS, // Permiso de escritura
    });

    const body = await req.json();
    const validarProducto = createProductoSchema.parse(body);

    // 1. Subir Foto a Supabase si existe
    let fotoUrl: string | null = null;
    if (typeof validarProducto.Foto === "string" && validarProducto.Foto.length > 0) {
      try {
        const b64Data = validarProducto.Foto.includes("base64,")
          ? validarProducto.Foto.split("base64,")[1]
          : validarProducto.Foto;
        const buffer = Buffer.from(b64Data, "base64");
        const supabase = getSupabaseServiceClient();
        const fileName = `${tenantId}/art-${Date.now()}.png`;

        const { error } = await supabase.storage
          .from("articulos")
          .upload(fileName, buffer, { contentType: "image/png", upsert: true });

        if (!error) {
          const { data } = supabase.storage.from("articulos").getPublicUrl(fileName);
          fotoUrl = data.publicUrl;
        } else {
          console.error("Supabase upload error (POST articulo):", error);
        }
      } catch (e) {
        console.error("Error procesando foto (POST articulo):", e);
      }
    }

    // Iniciar transacción para crear Precio y Artículo
    const producto = await prisma.$transaction(async (tx) => {
      // Ya no creamos "Precio", todo va directo en Articulo y PrecioLista
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
          // Redundancia/Costo en Articulo
          PrecioCosto: validarProducto.PrecioCosto,
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
          Foto: fotoUrl,
          Precios: {
            create: validarProducto.PreciosLista.map((pl) => ({
              TenantId: BigInt(tenantId),
              ListaPrecioId: BigInt(pl.ListaPrecioId),
              PorcentajeGanancia: pl.PorcentajeGanancia,
              PrecioFinal: pl.PrecioFinal,
            })),
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
          Precios: true,
        },
      });

      // Ya no actualizamos el Id de Precio

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
      permission: SET_PERMISSIONS.PRODUCTOS, // Permiso de escritura
    });

    const body = await req.json();
    const validarProducto = updateProductoSchema.parse(body);

    const tenantIdBigInt = BigInt(tenantId);

    // Buscar artículo y validar que pertenece al tenant
    const articulo = await prisma.articulo.findFirst({
      where: {
        Id: BigInt(validarProducto.Id),
        TenantId: tenantIdBigInt,
        // EstaEliminado: false,
      },
      include: {
        Precios: true,
      },
    });

    if (!articulo) {
      throw createError.notFound(
        "Artículo no encontrado o no pertenece a tu tenant",
      );
    }

    const producto = await prisma.$transaction(async (tx) => {
      // 1. Update PreciosLista (Only if provided)
      if (validarProducto.PreciosLista && validarProducto.PreciosLista.length > 0) {
        // Eliminar precios anteriores (podrías hacer upsert, pero recrear es más fácil si envían todo)
        await tx.precioLista.deleteMany({
          where: { ArticuloId: articulo.Id, TenantId: tenantIdBigInt },
        });
        
        await tx.precioLista.createMany({
          data: validarProducto.PreciosLista.map(pl => ({
            ArticuloId: articulo.Id,
            TenantId: tenantIdBigInt,
            ListaPrecioId: BigInt(pl.ListaPrecioId),
            PorcentajeGanancia: pl.PorcentajeGanancia,
            PrecioFinal: pl.PrecioFinal,
          }))
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
      // Sync PrecioCosto si cambió
      if (validarProducto.PrecioCosto !== undefined) {
        articuloData.PrecioCosto = validarProducto.PrecioCosto;
      }

      // Foto (base64 o URL actual)
      const b64 = validarProducto.Foto;
      if (typeof b64 === "string" && b64.length > 0) {
        // Si no empieza con http, es un base64 nuevo
        if (!b64.startsWith("http")) {
          try {
            const supabase = getSupabaseServiceClient();

            // Borrar foto vieja si era de supabase
            if (articulo.Foto && typeof articulo.Foto === "string" && articulo.Foto.includes("/articulos/")) {
              const urlParts = articulo.Foto.split("/articulos/");
              if (urlParts.length > 1) {
                const oldPath = urlParts[1];
                await supabase.storage.from("articulos").remove([oldPath]);
              }
            }

            const b64Data = b64.includes("base64,") ? b64.split("base64,")[1] : b64;
            const buffer = Buffer.from(b64Data, "base64");
            const fileName = `${tenantIdBigInt}/art-${Date.now()}.png`;

            const { error } = await supabase.storage
              .from("articulos")
              .upload(fileName, buffer, { contentType: "image/png", upsert: true });

            if (!error) {
              const { data } = supabase.storage.from("articulos").getPublicUrl(fileName);
              articuloData.Foto = data.publicUrl;
            } else {
              console.error("Supabase upload error (PATCH articulo):", error);
            }
          } catch (e) {
            console.error("Error subiendo foto update (PATCH articulo):", e);
          }
        }
        // Si empieza con http, significa que el usuario no cambió la foto en el form. No hacemos nada.
      } else {
        // Si enviaron vacío o nulo, podrían querer borrarla
        if (b64 === "" || b64 === null) {
          articuloData.Foto = null;
        }
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
      permission: SET_PERMISSIONS.PRODUCTOS, // Permiso de eliminación
    });

    const params = req.nextUrl.searchParams;
    const Id = params.get("Id");

    // Obtener estado actual del artículo
    const articuloActual = await prisma.articulo.findUnique({
      where: {
        Id: Number(Id),
        TenantId: BigInt(tenantId),
      },
      select: { EstaEliminado: true },
    });

    if (!articuloActual) {
      return NextResponse.json(
        { error: "Artículo no encontrado" },
        { status: 404 },
      );
    }

    // Toggle: invertir el estado
    const articulo = await prisma.articulo.update({
      where: {
        Id: Number(Id),
        TenantId: BigInt(tenantId),
      },
      data: {
        EstaEliminado: !articuloActual.EstaEliminado,
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
