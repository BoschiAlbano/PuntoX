import prisma from "@/DB/prisma";
import { Prisma } from "../../../prisma/generated/prisma";

/**
 * Obtiene y reserva el próximo número de comprobante para un tipo específico.
 * Incrementa el contador en la base de datos.
 *
 * @param tenantId ID del tenant
 * @param tipoComprobante Tipo de comprobante (Enum/Int)
 * @param sucursalId (Opcional) ID de la sucursal si la numeración es por sucursal
 * @param tx (Opcional) Cliente de transacción de Prisma
 * @returns El nuevo número de comprobante asignado
 */
export async function getNextNumeroComprobante(
  tenantId: bigint,
  tipoComprobante: number,
  sucursalId?: bigint | null,
  tx?: Prisma.TransactionClient,
): Promise<number> {
  const db = tx || prisma;

  // Buscar contador existente
  // Nota: Mantenemos la lógica actual que ignora SucursalId si no se pasa,
  // pero idealmente la numeración fiscal Argentina es por Punto de Venta (Sucursal).
  // Por ahora seguimos la lógica del endpoint original.

  const whereInput: Prisma.ContadorWhereInput = {
    TenantId: tenantId,
    TipoComprobante: tipoComprobante,
    EstaEliminado: false,
  };

  // Si se decide usar numeración por sucursal en el futuro:
  if (sucursalId) {
    whereInput.SucursalId = sucursalId;
  }

  let contador = await db.contador.findFirst({
    where: whereInput,
  });

  // Si no existe, crear uno nuevo con valor inicial 0 (para que el primer incremento sea 1)
  // O valor 1 si se usa como "actual".
  // La lógica original del endpoint crea con Valor 1, luego actualiza incrementando 1, retornando 2.
  // Vamos a ajustar para que sea más predecible: Si no existe, crea e inicia.

  if (!contador) {
    contador = await db.contador.create({
      data: {
        TenantId: tenantId,
        TipoComprobante: tipoComprobante,
        SucursalId: sucursalId || null, // Importante para unique constraints
        Valor: 0, // Iniciamos en 0 para que el primer incremento de 1
        EstaEliminado: false,
      },
    });
  }

  const contadorActualizado = await db.contador.update({
    where: { Id: contador.Id },
    data: {
      Valor: { increment: 1 },
    },
  });

  return contadorActualizado.Valor;
}
