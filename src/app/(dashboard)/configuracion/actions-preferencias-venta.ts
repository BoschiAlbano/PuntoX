"use server";

import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";

const LOCALIDAD_DUMMY_ID = 2014010;

export type PreferenciasVentaDTO = {
  ticketDigitalPorCorreo: boolean; // Mapea a Imprimir
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
 * Obtiene las preferencias de venta del tenant actual desde Configuracion.
 * Si no existen, retorna los valores por defecto sin crear en DB.
 */
export async function getPreferenciasVenta(): Promise<PreferenciasVentaDTO> {
  const { tenantId, error } = await getAuthUser();

  if (error || !tenantId) {
    // Si no está autenticado, retornar defaults
    return DEFAULT_PREFERENCIAS;
  }

  try {
    const config = await prisma.configuracion.findFirst({
      where: { 
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      select: {
        Imprimir: true,
        MostrarPreciosConIva: true,
        AbrirCajonEfectivo: true,
        NumerarPedidosPantalla: true,
      },
      orderBy: {
        Id: 'desc',
      },
    });

    if (!config) {
      // Si no existe, retornar defaults sin crear en DB
      return DEFAULT_PREFERENCIAS;
    }

    return {
      ticketDigitalPorCorreo: config.Imprimir ?? true,
      mostrarPreciosConIva: config.MostrarPreciosConIva ?? true,
      abrirCajonEfectivo: config.AbrirCajonEfectivo ?? true,
      numerarPedidosPantalla: config.NumerarPedidosPantalla ?? true,
    };
  } catch (error) {
    // En caso de error, retornar defaults
    return DEFAULT_PREFERENCIAS;
  }
}

/**
 * Guarda las preferencias de venta del tenant actual en Configuracion.
 * Actualiza la configuración existente o crea una nueva si no existe.
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
    // Usar transacción para asegurar atomicidad
    await prisma.$transaction(async (tx) => {
      // Buscar configuración existente
      const config = await tx.configuracion.findFirst({
        where: { 
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
        },
        orderBy: {
          Id: 'desc',
        },
      });

      // Si no existe configuración, crear una mínima válida
      if (!config) {
        await tx.configuracion.create({
          data: {
            TenantId: BigInt(tenantId),
            RazonSocial: "SIN DEFINIR",
            Cuit: "00000000000",
            Direccion: "SIN DEFINIR",
            LocalidadId: BigInt(LOCALIDAD_DUMMY_ID),
            FacturaDescuentaStock: true,
            PresupuestoDescuentaStock: false,
            RemitoDescuentaStock: true,
            ActualizaCostoDesdeCompra: true,
            ModificaPrecioVentaDesdeCompra: false,
            Imprimir: data.ticketDigitalPorCorreo,
            Instalada: 1,
            TipoFormaPagoPorDefectoVenta: 0,
            TipoFormaPagoPorDefectoCompra: 0,
            UnificarRenglonesIngresarMismoProducto: true,
            IngresoManualCajaInicial: false,
            PuestoCajaSeparado: false,
            ActivarRetiroDeCaja: false,
            MontoMaximoRetiroCaja: 0,
            ActivarBascula: false,
            EtiquetaPorPeso: false,
            CodigoBascula: null,
            EstaEliminado: false,
            ShowFoto: false,
            MostrarPreciosConIva: data.mostrarPreciosConIva,
            AbrirCajonEfectivo: data.abrirCajonEfectivo,
            NumerarPedidosPantalla: data.numerarPedidosPantalla,
          },
        });
      } else {
        // Actualizar la configuración existente dentro de la transacción
        await tx.configuracion.update({
          where: { 
            Id: config.Id,
            TenantId: BigInt(tenantId),
          },
          data: {
            Imprimir: data.ticketDigitalPorCorreo,
            MostrarPreciosConIva: data.mostrarPreciosConIva,
            AbrirCajonEfectivo: data.abrirCajonEfectivo,
            NumerarPedidosPantalla: data.numerarPedidosPantalla,
          },
        });
      }
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error guardando preferencias de venta:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : String(error)) || "No se pudieron guardar las preferencias de venta",
    };
  }
}

