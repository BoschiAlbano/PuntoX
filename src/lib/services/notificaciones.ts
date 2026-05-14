/**
 * Servicios de notificaciones automáticas del sistema.
 * Se llaman post-transacción para no bloquear las operaciones principales.
 */

import prisma from "@/DB/prisma";

/**
 * Verifica artículos cuyo stock cayó bajo el mínimo luego de una venta
 * y crea notificaciones WARNING para el tenant.
 * Usa deduplicación: no crea la notificación si ya existe una sin leer
 * para el mismo ArticuloStock.
 *
 * @param tenantId - ID del tenant
 * @param sucursalId - ID de la sucursal afectada
 * @param articuloIds - Lista de IDs de artículos que tuvieron movimiento de stock
 */
export async function triggerStockBajoNotifications(
  tenantId: bigint,
  sucursalId: bigint,
  articuloIds: bigint[],
): Promise<void> {
  if (articuloIds.length === 0) return;

  // Obtener registros de stock con info del artículo para los afectados
  const stockItems = await prisma.articuloStock.findMany({
    where: {
      ArticuloId: { in: articuloIds },
      SucursalId: sucursalId,
      TenantId: tenantId,
    },
    include: {
      Articulo: {
        select: {
          Descripcion: true,
          StockMinimo: true,
          EstaEliminado: true,
          DescuentaStock: true,
        },
      },
    },
  });

  for (const item of stockItems) {
    if (item.Articulo.EstaEliminado) continue;
    if (!item.Articulo.DescuentaStock) continue;

    const stockActual = Number(item.Stock);
    const stockMinimo = Number(
      item.StockMinimo ?? item.Articulo.StockMinimo ?? 0,
    );

    if (stockActual > stockMinimo) continue;

    const entidadId = item.Id.toString();

    // Deduplicación: no crear si ya existe una WARNING no leída para este ArticuloStock
    const existing = await prisma.notificacion.findFirst({
      where: {
        TenantId: tenantId,
        EntidadTipo: "ARTICULO_STOCK",
        EntidadId: entidadId,
        Tipo: "WARNING",
        Leida: false,
      },
    });

    if (existing) continue;

    await prisma.notificacion.create({
      data: {
        TenantId: tenantId,
        UsuarioId: null, // broadcast: visible para todos los admins del tenant
        Tipo: "WARNING",
        Titulo: "Stock bajo",
        Mensaje: `"${item.Articulo.Descripcion}" tiene stock bajo: ${stockActual} unidades (mínimo: ${stockMinimo}).`,
        AccionUrl: "/productos",
        EntidadTipo: "ARTICULO_STOCK",
        EntidadId: entidadId,
        Leida: false,
      },
    });
  }
}

/**
 * Marca como leídas las notificaciones de stock bajo de artículos que
 * ahora tienen stock suficiente (luego de una compra o ajuste).
 *
 * @param tenantId - ID del tenant
 * @param sucursalId - ID de la sucursal afectada
 * @param articuloIds - Lista de IDs de artículos que recibieron stock
 */
export async function resolveStockNotifications(
  tenantId: bigint,
  sucursalId: bigint,
  articuloIds: bigint[],
): Promise<void> {
  if (articuloIds.length === 0) return;

  const stockItems = await prisma.articuloStock.findMany({
    where: {
      ArticuloId: { in: articuloIds },
      SucursalId: sucursalId,
      TenantId: tenantId,
    },
    include: {
      Articulo: {
        select: {
          StockMinimo: true,
          EstaEliminado: true,
        },
      },
    },
  });

  // Solo artículos cuyo stock SUPERÓ el mínimo
  const resolvedEntidadIds = stockItems
    .filter((item) => {
      if (item.Articulo.EstaEliminado) return false;
      const stockActual = Number(item.Stock);
      const stockMinimo = Number(
        item.StockMinimo ?? item.Articulo.StockMinimo ?? 0,
      );
      return stockActual > stockMinimo;
    })
    .map((item) => item.Id.toString());

  if (resolvedEntidadIds.length === 0) return;

  await prisma.notificacion.updateMany({
    where: {
      TenantId: tenantId,
      EntidadTipo: "ARTICULO_STOCK",
      EntidadId: { in: resolvedEntidadIds },
      Tipo: "WARNING",
      Leida: false,
    },
    data: { Leida: true },
  });
}
