"use server";

import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";

export type PreferenciasVentaDTO = {
  existsConfiguracion: boolean;
  imprimir: boolean;
  unificarRenglonesProducto: boolean;
  tipoFormaPagoDefault: number;
  facturaDescuentaStock: boolean;
  presupuestoDescuentaStock: boolean;
  remitoDescuentaStock: boolean;
  ingresoManualCajaInicial: boolean;
  puestoCajaSeparado: boolean;
  activarRetiroDeCaja: boolean;
  montoMaximoRetiroCaja: number;
  activarBascula: boolean;
  etiquetaPorPeso: boolean;
  codigoBascula: string | null;
  mostrarPreciosConIva: boolean;
  abrirCajonEfectivo: boolean;
  numerarPedidosPantalla: boolean;
};

export type SavePreferenciasVentaInput = {
  imprimir: boolean;
  unificarRenglonesProducto: boolean;
  tipoFormaPagoDefault: number;
  facturaDescuentaStock: boolean;
  presupuestoDescuentaStock: boolean;
  remitoDescuentaStock: boolean;
  ingresoManualCajaInicial: boolean;
  puestoCajaSeparado: boolean;
  activarRetiroDeCaja: boolean;
  montoMaximoRetiroCaja: number;
  activarBascula: boolean;
  etiquetaPorPeso: boolean;
  codigoBascula: string | null;
  mostrarPreciosConIva: boolean;
  abrirCajonEfectivo: boolean;
  numerarPedidosPantalla: boolean;
};

/**
 * Obtiene las preferencias de venta desde Configuracion vigente
 */
export async function getPreferenciasVenta(): Promise<PreferenciasVentaDTO> {
  const { tenantId, error } = await getAuthUser();

  if (error || !tenantId) {
    throw new Error("No autenticado");
  }

  try {
    // Obtener Configuracion vigente
    const configuracion = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      orderBy: {
        Id: "desc",
      },
      select: {
        Imprimir: true,
        UnificarRenglonesIngresarMismoProducto: true,
        TipoFormaPagoPorDefectoVenta: true,
        FacturaDescuentaStock: true,
        PresupuestoDescuentaStock: true,
        RemitoDescuentaStock: true,
        IngresoManualCajaInicial: true,
        PuestoCajaSeparado: true,
        ActivarRetiroDeCaja: true,
        MontoMaximoRetiroCaja: true,
        ActivarBascula: true,
        EtiquetaPorPeso: true,
        CodigoBascula: true,
        MostrarPreciosConIva: true,
        AbrirCajonEfectivo: true,
        NumerarPedidosPantalla: true,
      },
    });

    if (!configuracion) {
      return {
        existsConfiguracion: false,
        imprimir: false,
        unificarRenglonesProducto: true,
        tipoFormaPagoDefault: 0,
        facturaDescuentaStock: true,
        presupuestoDescuentaStock: false,
        remitoDescuentaStock: true,
        ingresoManualCajaInicial: false,
        puestoCajaSeparado: false,
        activarRetiroDeCaja: false,
        montoMaximoRetiroCaja: 0,
        activarBascula: false,
        etiquetaPorPeso: false,
        codigoBascula: null,
        mostrarPreciosConIva: true,
        abrirCajonEfectivo: true,
        numerarPedidosPantalla: true,
      };
    }

    return {
      existsConfiguracion: true,
      imprimir: configuracion.Imprimir,
      unificarRenglonesProducto: configuracion.UnificarRenglonesIngresarMismoProducto,
      tipoFormaPagoDefault: Number(configuracion.TipoFormaPagoPorDefectoVenta),
      facturaDescuentaStock: configuracion.FacturaDescuentaStock,
      presupuestoDescuentaStock: configuracion.PresupuestoDescuentaStock,
      remitoDescuentaStock: configuracion.RemitoDescuentaStock,
      ingresoManualCajaInicial: configuracion.IngresoManualCajaInicial,
      puestoCajaSeparado: configuracion.PuestoCajaSeparado,
      activarRetiroDeCaja: configuracion.ActivarRetiroDeCaja,
      montoMaximoRetiroCaja: Number(configuracion.MontoMaximoRetiroCaja),
      activarBascula: configuracion.ActivarBascula,
      etiquetaPorPeso: configuracion.EtiquetaPorPeso,
      codigoBascula: configuracion.CodigoBascula,
      mostrarPreciosConIva: configuracion.MostrarPreciosConIva ?? true,
      abrirCajonEfectivo: configuracion.AbrirCajonEfectivo ?? true,
      numerarPedidosPantalla: configuracion.NumerarPedidosPantalla ?? true,
    };
  } catch (error: any) {
    console.error("Error obteniendo preferencias de venta:", error);
    throw new Error(
      error?.message || "No se pudieron obtener las preferencias de venta"
    );
  }
}

/**
 * Guarda las preferencias de venta en Configuracion vigente
 * Si no existe Configuracion, lanza error CONFIG_MISSING
 */
export async function savePreferenciasVenta(
  input: SavePreferenciasVentaInput
): Promise<{ success: boolean; error?: string; code?: string }> {
  const { tenantId, error } = await getAuthUser();

  if (error || !tenantId) {
    return {
      success: false,
      error: "No autenticado",
    };
  }

  try {
    // Buscar Configuracion vigente
    const configuracionVigente = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      orderBy: {
        Id: "desc",
      },
    });

    if (!configuracionVigente) {
      return {
        success: false,
        error: "No existe configuración. Completa primero el Perfil del negocio.",
        code: "CONFIG_MISSING",
      };
    }

    // Actualizar solo los campos de venta/caja/stock
    await prisma.configuracion.update({
      where: { Id: configuracionVigente.Id },
      data: {
        Imprimir: input.imprimir,
        UnificarRenglonesIngresarMismoProducto: input.unificarRenglonesProducto,
        TipoFormaPagoPorDefectoVenta: input.tipoFormaPagoDefault,
        FacturaDescuentaStock: input.facturaDescuentaStock,
        PresupuestoDescuentaStock: input.presupuestoDescuentaStock,
        RemitoDescuentaStock: input.remitoDescuentaStock,
        IngresoManualCajaInicial: input.ingresoManualCajaInicial,
        PuestoCajaSeparado: input.puestoCajaSeparado,
        ActivarRetiroDeCaja: input.activarRetiroDeCaja,
        MontoMaximoRetiroCaja: input.montoMaximoRetiroCaja,
        ActivarBascula: input.activarBascula,
        EtiquetaPorPeso: input.etiquetaPorPeso,
        CodigoBascula: input.codigoBascula,
        MostrarPreciosConIva: input.mostrarPreciosConIva,
        AbrirCajonEfectivo: input.abrirCajonEfectivo,
        NumerarPedidosPantalla: input.numerarPedidosPantalla,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error guardando preferencias de venta:", error);
    return {
      success: false,
      error: error?.message || "No se pudieron guardar las preferencias de venta",
    };
  }
}

