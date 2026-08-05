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
import { ejecutarBorradoFisico } from "@/lib/errors/hardDelete";
import { fotoDefault } from "@/utilities/fotoDefault";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { resolveStockNotifications } from "@/lib/services/notificaciones";
import { assertDentroDeLimite } from "@/lib/planes/features";
import { guardarEnCacheSiCorresponde } from "@/lib/services/imagenProductoCache";
import { ImagenCacheFuente } from "../../../../prisma/generated/prisma";
import { optimizeImageToWebp } from "@/lib/utils/imageOptimizer";

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
    const incluirInactivos =
      req.nextUrl.searchParams.get("incluirInactivos") === "true";
    const editIdParam = req.nextUrl.searchParams.get("editId");
    const editId = editIdParam ? Number(editIdParam) : null;

    const tipoParam = req.nextUrl.searchParams.get("tipo");

    // Construir where clause
    const where: {
      TenantId: bigint;
      EsCombo?: boolean;
      EstaEliminado?: boolean;
      OR?: Array<{
        Descripcion?: { contains: string; mode: "insensitive" };
        CodigoBarra?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      TenantId: BigInt(tenantId),
      ...(incluirInactivos ? {} : { EstaEliminado: false }),
    };

    if (tipoParam === "combo") {
      where.EsCombo = true;
    } else if (tipoParam === "articulo") {
      where.EsCombo = false;
    }

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

    let exactEditMatch: any[] = [];
    if (editId) {
      exactEditMatch = await prisma.articulo.findMany({
        where: { TenantId: BigInt(tenantId), Id: editId },
        select: {
          Id: true, Codigo: true, CodigoBarra: true, Descripcion: true, EstaEliminado: true, StockMinimo: true, PrecioCosto: true, Foto: true, TipoVenta: true, EsCombo: true,
          Marca: { select: { Descripcion: true } },
          Rubro: { select: { Descripcion: true } },
          Precios: { select: { ListaPrecioId: true, PorcentajeGanancia: true, PrecioFinal: true, ListaPrecio: { select: { Nombre: true } } } },
          PromocionesCantidad: { select: { Id: true, Cantidad: true, DescuentoPorcentaje: true, EstaActiva: true } },
          ArticuloStock: { where: { SucursalId: BigInt(sucursalId) }, take: 1, select: { Stock: true, StockMinimo: true, Sucursal: { select: { Nombre: true } } } },
          ArticulosCombo: {
            select: {
              CantidadRequerida: true,
              Componente: {
                select: {
                  Descripcion: true,
                  ArticuloStock: {
                    where: { SucursalId: BigInt(sucursalId) },
                    take: 1,
                    select: { Stock: true }
                  }
                }
              }
            }
          }
        },
      });
    }

    const exactIds = exactEditMatch.map(p => p.Id);
    if (exactIds.length > 0) {
      (where as any).AND = [
        ...((where as any).AND || []),
        { Id: { notIn: exactIds } }
      ];
    }

    const restLimit = Math.max(0, (pagination.limit ?? 20) - exactIds.length);

    // Obtener productos paginados
    const restProductos = await prisma.articulo.findMany({
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
        TipoVenta: true,
        EsCombo: true,

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
        PromocionesCantidad: {
          select: {
            Id: true,
            Cantidad: true,
            DescuentoPorcentaje: true,
            EstaActiva: true,
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
        ArticulosCombo: {
          select: {
            CantidadRequerida: true,
            Componente: {
              select: {
                Descripcion: true,
                ArticuloStock: {
                  where: { SucursalId: BigInt(sucursalId) },
                  take: 1,
                  select: { Stock: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        Descripcion: "asc",
      },
      skip: exactIds.length > 0 && pagination.skip === 0 ? 0 : pagination.skip,
      take: restLimit,
    });

    const productos = [...exactEditMatch, ...restProductos];

    // Mapear productos
    const productosConStock = productos.map((producto) => {
      const stockSucursal =
        sucursalId && Array.isArray(producto.ArticuloStock)
          ? producto.ArticuloStock[0]
          : null;

      let stockCalculado = stockSucursal ? Number(stockSucursal.Stock) : Number(0);

      // Si es combo, calcular el stock en base a los componentes
      if (producto.EsCombo && producto.ArticulosCombo && producto.ArticulosCombo.length > 0) {
        let minStock = Infinity;
        for (const item of producto.ArticulosCombo) {
          const compStock = item.Componente?.ArticuloStock?.[0]?.Stock ? Number(item.Componente.ArticuloStock[0].Stock) : 0;
          const req = Number(item.CantidadRequerida);
          if (req > 0) {
            const possible = Math.floor(compStock / req);
            if (possible < minStock) {
              minStock = possible;
            }
          }
        }
        if (minStock === Infinity) minStock = 0;
        stockCalculado = minStock;
      }

      return {
        // Campos basicos
        Id: Number(producto.Id),
        Codigo: producto.Codigo,
        CodigoBarra: producto.CodigoBarra,
        Descripcion: producto.Descripcion,
        EstaEliminado: producto.EstaEliminado,
        Foto: producto.Foto,
        TipoVenta: producto.TipoVenta,
        EsCombo: producto.EsCombo,

        Marca: producto.Marca
          ? { Descripcion: producto.Marca.Descripcion }
          : null,
        Rubro: producto.Rubro
          ? { Descripcion: producto.Rubro.Descripcion }
          : null,

        // Stock logic (StockMinimo: sucursal o valor global)
        Stock: stockCalculado,
        StockMinimo:
          stockSucursal?.StockMinimo != null
            ? Number(stockSucursal.StockMinimo)
            : Number(producto.StockMinimo ?? 0),
        SucursalNombre: stockSucursal?.Sucursal.Nombre || null,
        // Precios
        PrecioCosto: Number(producto.PrecioCosto || 0),
        PreciosLista: producto.Precios.map((p: any) => ({
          ListaPrecioId: Number(p.ListaPrecioId),
          PorcentajeGanancia: Number(p.PorcentajeGanancia),
          PrecioFinal: Number(p.PrecioFinal),
          ListaPrecio: p.ListaPrecio ? { Nombre: p.ListaPrecio.Nombre } : undefined,
        })),
        PromocionesCantidad: producto.PromocionesCantidad?.map((p: any) => ({
          Id: Number(p.Id),
          Cantidad: Number(p.Cantidad),
          PrecioFinal: Number(p.PrecioFinal),
          EstaActiva: Boolean(p.EstaActiva)
        })) || [],
        ComponentesCombo: producto.ArticulosCombo?.map((c: any) => ({
          CantidadRequerida: Number(c.CantidadRequerida),
          Descripcion: c.Componente?.Descripcion || "",
          Stock: c.Componente?.ArticuloStock?.[0]?.Stock ? Number(c.Componente.ArticuloStock[0].Stock) : 0,
        })) || [],
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
    const { tenantId, sucursalId, isSuperAdmin, usuarioId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.PRODUCTOS, // Permiso de escritura
    });

    await assertDentroDeLimite(tenantId, "articulos");

    const body = await req.json();
    const validarProducto = createProductoSchema.parse(body);

    const codigoExistente = await prisma.articulo.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        Codigo: validarProducto.Codigo,
        EstaEliminado: false,
      },
      select: { Id: true },
    });
    if (codigoExistente) {
      throw createError.conflict(
        `El código ${validarProducto.Codigo} ya está en uso por otro producto`,
        { field: "Codigo" },
      );
    }

    // 1. Subir Foto a Supabase si existe
    let fotoUrl: string | null = null;
    if (typeof validarProducto.Foto === "string" && validarProducto.Foto.length > 0) {
      try {
        const b64Data = validarProducto.Foto.includes("base64,")
          ? validarProducto.Foto.split("base64,")[1]
          : validarProducto.Foto;
        const rawBuffer = Buffer.from(b64Data, "base64");
        const optimized = await optimizeImageToWebp(rawBuffer);
        const supabase = getSupabaseServiceClient();
        const fileName = `${tenantId}/art-${Date.now()}.${optimized.extension}`;

        const { error } = await supabase.storage
          .from("articulos")
          .upload(fileName, optimized.buffer, {
            contentType: optimized.contentType,
            upsert: true,
          });

        if (!error) {
          const { data } = supabase.storage.from("articulos").getPublicUrl(fileName);
          fotoUrl = data.publicUrl;

          await guardarEnCacheSiCorresponde({
            codigoBarra: validarProducto.CodigoBarra,
            codigoBarraGenerado: validarProducto.CodigoBarraGenerado ?? false,
            descripcion: validarProducto.Descripcion,
            imageBuffer: optimized.buffer,
            fuente: ImagenCacheFuente.USUARIO,
            isSuperAdmin,
            tenantId: BigInt(tenantId),
            userId: BigInt(usuarioId),
          });
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
          CodigoBarraGenerado: validarProducto.CodigoBarraGenerado ?? false,
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
          EsCombo: validarProducto.EsCombo ?? false,
          ArticulosCombo: {
            create: validarProducto.EsCombo && validarProducto.ComponentesCombo ? validarProducto.ComponentesCombo.map(c => ({
              TenantId: BigInt(tenantId),
              ComponenteId: BigInt(c.ComponenteId),
              CantidadRequerida: c.CantidadRequerida,
            })) : [],
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
          PromocionesCantidad: {
            create: validarProducto.PromocionesCantidad?.map((pc) => ({
              TenantId: BigInt(tenantId),
              Cantidad: pc.Cantidad,
              DescuentoPorcentaje: pc.DescuentoPorcentaje,
              EstaActiva: pc.EstaActiva,
            })) || [],
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
    const { tenantId, sucursalId, isSuperAdmin, usuarioId } = await getAuthContext({
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

    if (
      validarProducto.Codigo !== undefined &&
      validarProducto.Codigo !== articulo.Codigo
    ) {
      const codigoExistente = await prisma.articulo.findFirst({
        where: {
          TenantId: tenantIdBigInt,
          Codigo: validarProducto.Codigo,
          EstaEliminado: false,
          Id: { not: articulo.Id },
        },
        select: { Id: true },
      });
      if (codigoExistente) {
        throw createError.conflict(
          `El código ${validarProducto.Codigo} ya está en uso por otro producto`,
          { field: "Codigo" },
        );
      }
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

      // Update PromocionesCantidad
      if (validarProducto.PromocionesCantidad) {
        await tx.promocionCantidad.deleteMany({
          where: { ArticuloId: articulo.Id, TenantId: tenantIdBigInt },
        });
        
        await tx.promocionCantidad.createMany({
          data: validarProducto.PromocionesCantidad.map(pc => ({
            ArticuloId: articulo.Id,
            TenantId: tenantIdBigInt,
            Cantidad: pc.Cantidad,
            DescuentoPorcentaje: pc.DescuentoPorcentaje,
            EstaActiva: pc.EstaActiva,
          })),
        });
      }

      // Update ArticulosCombo
      if (validarProducto.EsCombo && validarProducto.ComponentesCombo) {
        await tx.articuloComboItem.deleteMany({
          where: { ComboId: articulo.Id, TenantId: tenantIdBigInt },
        });
        await tx.articuloComboItem.createMany({
          data: validarProducto.ComponentesCombo.map((c) => ({
            ComboId: articulo.Id,
            TenantId: tenantIdBigInt,
            ComponenteId: BigInt(c.ComponenteId),
            CantidadRequerida: c.CantidadRequerida,
          })),
        });
      } else if (validarProducto.EsCombo === false) {
        await tx.articuloComboItem.deleteMany({
          where: { ComboId: articulo.Id, TenantId: tenantIdBigInt },
        });
      }

      // 2. Prepare Articulo Update Data
      const articuloData: any = {};

      // Direct fields mapping
      const directFields = [
        "Codigo",
        "CodigoBarra",
        "CodigoBarraGenerado",
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
        "EsCombo",
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
            const rawBuffer = Buffer.from(b64Data, "base64");
            const optimized = await optimizeImageToWebp(rawBuffer);
            const fileName = `${tenantIdBigInt}/art-${Date.now()}.${optimized.extension}`;

            const { error } = await supabase.storage
              .from("articulos")
              .upload(fileName, optimized.buffer, {
                contentType: optimized.contentType,
                upsert: true,
              });

            if (!error) {
              const { data } = supabase.storage.from("articulos").getPublicUrl(fileName);
              articuloData.Foto = data.publicUrl;

              await guardarEnCacheSiCorresponde({
                codigoBarra: validarProducto.CodigoBarra ?? articulo.CodigoBarra,
                codigoBarraGenerado:
                  validarProducto.CodigoBarraGenerado ?? articulo.CodigoBarraGenerado,
                descripcion: validarProducto.Descripcion ?? articulo.Descripcion,
                imageBuffer: optimized.buffer,
                fuente: ImagenCacheFuente.USUARIO,
                isSuperAdmin,
                tenantId: tenantIdBigInt,
                userId: BigInt(usuarioId),
              });
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

    // Resolver notificaciones de stock bajo si se actualizó el stock
    if (sucursalId && validarProducto.Stock !== undefined) {
      resolveStockNotifications(
        BigInt(tenantId),
        BigInt(sucursalId),
        [BigInt(validarProducto.Id)],
      ).catch((e) => console.error("resolveStockNotifications error:", e));
    }

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
    const permanente = params.get("permanente") === "true";

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

    if (permanente) {
      if (!articuloActual.EstaEliminado) {
        return NextResponse.json(
          {
            error:
              "Primero tenés que desactivar el producto antes de eliminarlo definitivamente",
          },
          { status: 400 },
        );
      }

      await ejecutarBorradoFisico(async () => {
        await prisma.$transaction(async (tx) => {
          await tx.precioLista.deleteMany({
            where: { ArticuloId: Number(Id), TenantId: BigInt(tenantId) },
          });
          await tx.articulo.delete({
            where: { Id: Number(Id), TenantId: BigInt(tenantId) },
          });
        });
      }, "No se puede eliminar definitivamente: el producto tiene ventas, bajas de stock o integra un combo.");

      return NextResponse.json(
        { success: true, Id: Number(Id) },
        { status: 200 },
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
