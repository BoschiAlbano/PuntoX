import prisma from "@/DB/prisma";
import { createError } from "@/lib/errors/types";

type Id = bigint | number | string;

/** Ids que llegan del cliente y que tienen que ser del mismo comercio. */
export interface ReferenciasTenant {
  marcaId?: Id | null;
  rubroId?: Id | null;
  unidadMedidaId?: Id | null;
  listaPrecioIds?: Id[];
  /** Componentes de un combo. */
  articuloIds?: Id[];
}

const unicos = (ids: Id[]): bigint[] =>
  [...new Set(ids.map((i) => BigInt(i).toString()))].map((s) => BigInt(s));

async function verificar(
  ids: Id[],
  contar: (ids: bigint[]) => Promise<number>,
  mensaje: string,
) {
  const lista = unicos(ids);
  if (lista.length === 0) return;
  if ((await contar(lista)) !== lista.length) {
    throw createError.validation(`${mensaje} para este comercio`);
  }
}

/**
 * Verifica que las referencias de un producto o cliente (marca, rubro,
 * unidad, listas de precios, componentes) sean del comercio. Sin esto, un
 * usuario podía mandar el Id de una marca o lista de precios de OTRO
 * comercio y quedaba vinculada. Lanza 400 si alguna no corresponde.
 *
 * No filtra por EstaEliminado: editar un producto que apunta a una marca
 * ya dada de baja no tiene que fallar.
 */
export async function assertReferenciasDelTenant(
  tenantId: Id,
  refs: ReferenciasTenant,
): Promise<void> {
  const TenantId = BigInt(tenantId);
  const checks: Promise<void>[] = [];

  if (refs.marcaId != null) {
    checks.push(
      verificar([refs.marcaId], (ids) => prisma.marca.count({ where: { Id: { in: ids }, TenantId } }), "Marca no válida"),
    );
  }
  if (refs.rubroId != null) {
    checks.push(
      verificar([refs.rubroId], (ids) => prisma.rubro.count({ where: { Id: { in: ids }, TenantId } }), "Rubro no válido"),
    );
  }
  if (refs.unidadMedidaId != null) {
    checks.push(
      verificar(
        [refs.unidadMedidaId],
        (ids) => prisma.unidadMedida.count({ where: { Id: { in: ids }, TenantId } }),
        "Unidad de medida no válida",
      ),
    );
  }
  if (refs.listaPrecioIds?.length) {
    checks.push(
      verificar(
        refs.listaPrecioIds,
        (ids) => prisma.listaPrecio.count({ where: { Id: { in: ids }, TenantId } }),
        "Lista de precios no válida",
      ),
    );
  }
  if (refs.articuloIds?.length) {
    checks.push(
      verificar(
        refs.articuloIds,
        (ids) => prisma.articulo.count({ where: { Id: { in: ids }, TenantId } }),
        "Artículo del combo no válido",
      ),
    );
  }

  await Promise.all(checks);
}
