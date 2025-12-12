"use server";

import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";

export type PreferenciasVentaDTO = {
  ticketDigitalPorCorreo: boolean;
  mostrarPreciosConIva: boolean;
  abrirCajonEfectivo: boolean;
  numerarPedidosPantalla: boolean;
};

const DEFAULT_PREFERENCIAS: PreferenciasVentaDTO = {
  ticketDigitalPorCorreo: true,
  mostrarPreciosConIva: true,
  abrirCajonEfectivo: true,
  numerarPedidosPantalla: true,
};

/**
 * Obtiene las preferencias de venta del tenant actual.
 * Si no existen, retorna los valores por defecto sin crear en DB.
 */
export async function getPreferenciasVenta(): Promise<PreferenciasVentaDTO> {
  const { tenantId, error } = await getAuthUser();

  if (error || !tenantId) {
    // Si no está autenticado, retornar defaults
    return DEFAULT_PREFERENCIAS;
  }

  try {
    const preferencias = await prisma.preferenciasVenta.findUnique({
      where: { TenantId: BigInt(tenantId) },
      select: {
        TicketDigitalPorCorreo: true,
        MostrarPreciosConIva: true,
        AbrirCajonEfectivo: true,
        NumerarPedidosPantalla: true,
      },
    });

    if (!preferencias) {
      // Si no existe, retornar defaults sin crear en DB
      return DEFAULT_PREFERENCIAS;
    }

    return {
      ticketDigitalPorCorreo: preferencias.TicketDigitalPorCorreo,
      mostrarPreciosConIva: preferencias.MostrarPreciosConIva,
      abrirCajonEfectivo: preferencias.AbrirCajonEfectivo,
      numerarPedidosPantalla: preferencias.NumerarPedidosPantalla,
    };
  } catch (error) {
    console.error("Error obteniendo preferencias de venta:", error);
    // En caso de error, retornar defaults
    return DEFAULT_PREFERENCIAS;
  }
}

/**
 * Guarda las preferencias de venta del tenant actual.
 * Usa upsert para crear o actualizar según corresponda.
 */
export async function savePreferenciasVenta(
  data: PreferenciasVentaDTO
): Promise<{ success: boolean; error?: string }> {
  const { tenantId, error } = await getAuthUser();

  if (error || !tenantId) {
    return {
      success: false,
      error: "No autenticado",
    };
  }

  try {
    await prisma.preferenciasVenta.upsert({
      where: { TenantId: BigInt(tenantId) },
      create: {
        TenantId: BigInt(tenantId),
        TicketDigitalPorCorreo: data.ticketDigitalPorCorreo,
        MostrarPreciosConIva: data.mostrarPreciosConIva,
        AbrirCajonEfectivo: data.abrirCajonEfectivo,
        NumerarPedidosPantalla: data.numerarPedidosPantalla,
      },
      update: {
        TicketDigitalPorCorreo: data.ticketDigitalPorCorreo,
        MostrarPreciosConIva: data.mostrarPreciosConIva,
        AbrirCajonEfectivo: data.abrirCajonEfectivo,
        NumerarPedidosPantalla: data.numerarPedidosPantalla,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error guardando preferencias de venta:", error);
    return {
      success: false,
      error:
        error?.message || "No se pudieron guardar las preferencias de venta",
    };
  }
}

