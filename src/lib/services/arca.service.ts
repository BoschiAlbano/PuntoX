/**
 * Servicio de integración con ARCA (ex-AFIP) para facturación electrónica.
 * Wrapper de @arcasdk/core adaptado a PuntoX.
 */

import { decryptText } from './crypto.service';
import prisma from '@/DB/prisma';
import {
  TIPO_COMPROBANTE_LOCAL_A_AFIP,
  CONCEPTO_AFIP,
  MONEDA_LOCAL_A_AFIP,
  PORCENTAJE_IVA_A_AFIP,
  ESTADO_FACTURA_ELECTRONICA,
  RESULTADO_AFIP,
  requiereAutorizacionAfip,
} from '@/lib/constants/afip';

// Types for ARCA integration
export interface ArcaConfig {
  cuit: number;
  cert: string;       // Certificado PEM desencriptado
  key: string;        // Clave privada PEM desencriptada
  production: boolean;
}

export interface VoucherData {
  CantReg: number;
  PtoVta: number;
  CbteTipo: number;
  Concepto: number;
  DocTipo: number;
  DocNro: number;
  CbteDesde: number;
  CbteHasta: number;
  CbteFch: string;    // YYYYMMDD
  ImpTotal: number;
  ImpTotConc: number;
  ImpNeto: number;
  ImpOpEx: number;
  ImpIVA: number;
  ImpTrib: number;
   MonId: string;
   MonCotiz: number;
   CondicionIVAReceptorId?: number;
  // Campos de servicio (Concepto 2 o 3)
  FchServDesde?: string;
  FchServHasta?: string;
  FchVtoPago?: string;
  // Detalle IVA
  Iva?: Array<{
    Id: number;
    BaseImp: number;
    Importe: number;
  }>;
}

export interface VoucherResult {
  CAE: string;
  CAEFchVto: string;
  CbteDesde: number;
  CbteHasta: number;
  Resultado: string; // 'A' | 'R' | 'P'
  Observaciones?: string;
  Errores?: string;
}

export interface AutorizarComprobanteInput {
  comprobanteId: bigint;
  tenantId: bigint;
  sucursalId: bigint;
}

export interface AutorizarComprobanteResult {
  success: boolean;
  cae?: string;
  caeFchVto?: string;
  cbteNumero?: number;
  resultado?: string;
  observaciones?: string;
  errores?: string;
  facturaElectronicaId?: bigint;
}

/**
 * Obtiene la configuración AFIP del tenant, desencriptando los certificados.
 * Retorna null si no hay configuración AFIP habilitada.
 */
export async function getArcaConfig(tenantId: bigint, checkHabilitado = true): Promise<ArcaConfig | null> {
  const config = await prisma.configuracion.findFirst({
    where: {
      TenantId: tenantId,
      EstaEliminado: false,
    },
    select: {
      Cuit: true,
      AfipCertificado: true,
      AfipClavePrivada: true,
      AfipEntornoProduccion: true,
      AfipHabilitado: true,
    },
  });

  if (!config || !config.AfipCertificado || !config.AfipClavePrivada) {
    return null;
  }

  if (checkHabilitado && !config.AfipHabilitado) {
    return null;
  }

  // Limpiar CUIT (quitar guiones)
  const cuitLimpio = config.Cuit.replace(/[-\s]/g, '');
  if (!/^\d{11}$/.test(cuitLimpio)) {
    throw new Error(`CUIT inválido: ${config.Cuit}. Debe tener 11 dígitos.`);
  }

  try {
    const cert = decryptText(config.AfipCertificado);
    const key = decryptText(config.AfipClavePrivada);

    return {
      cuit: Number(cuitLimpio),
      cert,
      key,
      production: config.AfipEntornoProduccion,
    };
  } catch (error) {
    throw new Error(
      'Error al desencriptar certificados AFIP. Verifique que AFIP_ENCRYPTION_KEY sea correcta.'
    );
  }
}

/**
 * Obtiene el punto de venta AFIP asignado a una sucursal.
 */
export async function getPuntoVentaSucursal(
  tenantId: bigint,
  sucursalId: bigint,
): Promise<number | null> {
  const sucursal = await prisma.sucursal.findFirst({
    where: {
      Id: sucursalId,
      TenantId: tenantId,
      EstaEliminado: false,
    },
    select: {
      PuntoVentaAfip: true,
    },
  });

  return sucursal?.PuntoVentaAfip ?? null;
}

/**
 * Obtiene el último número de comprobante autorizado por AFIP para un PDV + tipo.
 * Usa la librería @arcasdk/core para consultar directamente a ARCA.
 */
export async function getUltimoComprobanteAutorizado(
  arcaConfig: ArcaConfig,
  puntoVenta: number,
  cbteTipo: number,
): Promise<number> {
  try {
    // Dynamic import para evitar errores si el paquete no está instalado
    const { Arca } = await import('@arcasdk/core');
    
    const arca = new Arca({
      cuit: arcaConfig.cuit,
      cert: arcaConfig.cert,
      key: arcaConfig.key,
      production: arcaConfig.production,
    });

    const result = await arca.electronicBillingService.getLastVoucher(puntoVenta, cbteTipo);
    // El SDK retorna { cbteNro, cbteTipo, ptoVta }, no un número directo
    return (result as any)?.cbteNro ?? 0;
  } catch (error: any) {
    console.error('[ARCA] Error al consultar último comprobante:', error.message);
    throw new Error(`Error al consultar último comprobante ARCA: ${error.message}`);
  }
}

/**
 * Obtiene la información de un comprobante específico desde ARCA.
 */
export async function getVoucherInfo(
  arcaConfig: ArcaConfig,
  puntoVenta: number,
  cbteTipo: number,
  cbteNumero: number,
): Promise<any | null> {
  try {
    const { Arca } = await import('@arcasdk/core');
    
    const arca = new Arca({
      cuit: arcaConfig.cuit,
      cert: arcaConfig.cert,
      key: arcaConfig.key,
      production: arcaConfig.production,
    });

    const result = await arca.electronicBillingService.getVoucherInfo(cbteNumero, puntoVenta, cbteTipo);
    return result;
  } catch (error: any) {
    console.error('[ARCA] Error al consultar información de comprobante:', error.message);
    return null;
  }
}

/**
 * Autoriza un comprobante contra ARCA (solicita CAE).
 */
export async function autorizarVoucher(
  arcaConfig: ArcaConfig,
  voucherData: VoucherData,
): Promise<VoucherResult> {
  try {
    const { Arca } = await import('@arcasdk/core');
    
    const arca = new Arca({
      cuit: arcaConfig.cuit,
      cert: arcaConfig.cert,
      key: arcaConfig.key,
      production: arcaConfig.production,
    });

    console.log('[ARCA] Enviando voucher:', JSON.stringify(voucherData, null, 2));
    const result = await arca.electronicBillingService.createVoucher(voucherData);
    console.log('[ARCA] Respuesta raw:', JSON.stringify(result, null, 2));
    
    // La respuesta del SDK tiene la estructura: result.response.FeDetResp.FECAEDetResponse[0]
    const rawResult = result as any;
    const detResp = rawResult?.response?.FeDetResp?.FECAEDetResponse?.[0];
    
    // Observaciones AFIP (ej: código 10051 - error de alicuota)
    const obsArray = detResp?.Observaciones?.Obs;
    const observaciones = obsArray
      ? (Array.isArray(obsArray) ? obsArray : [obsArray])
          .map((o: any) => `[${o.Code}] ${o.Msg}`)
          .join(' | ')
      : undefined;

    // Errores a nivel cabecera
    const errArray = rawResult?.response?.Errors?.Err;
    const errores = errArray
      ? (Array.isArray(errArray) ? errArray : [errArray])
          .map((e: any) => `[${e.Code}] ${e.Msg}`)
          .join(' | ')
      : undefined;
    
    return {
      CAE: result?.cae || '',
      CAEFchVto: result?.caeFchVto || '',
      CbteDesde: voucherData.CbteDesde,
      CbteHasta: voucherData.CbteHasta,
      Resultado: result?.cae ? RESULTADO_AFIP.APROBADO : RESULTADO_AFIP.RECHAZADO,
      Observaciones: observaciones,
      Errores: errores,
    };
  } catch (error: any) {
    // Loguear el error completo para diagnóstico
    console.error('[ARCA] Error al autorizar comprobante - mensaje:', error.message);
    console.error('[ARCA] Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Intentar extraer detalle del error según distintos formatos del SDK
    const errorDetail = error.message
      || error.Msg
      || (error.Errors && JSON.stringify(error.Errors))
      || (error.errors && JSON.stringify(error.errors))
      || 'Error desconocido al autorizar en ARCA';

    return {
      CAE: '',
      CAEFchVto: '',
      CbteDesde: voucherData.CbteDesde,
      CbteHasta: voucherData.CbteHasta,
      Resultado: RESULTADO_AFIP.RECHAZADO,
      Errores: errorDetail,
    };
  }
}

/**
 * Verifica la conexión con ARCA autenticándose y consultando los PDV habilitados.
 */
export async function verificarConexionArca(
  arcaConfig: ArcaConfig,
): Promise<{ ok: boolean; puntosDeVenta?: any[]; error?: string }> {
  try {
    const { Arca } = await import('@arcasdk/core');
    
    const arca = new Arca({
      cuit: arcaConfig.cuit,
      cert: arcaConfig.cert,
      key: arcaConfig.key,
      production: arcaConfig.production,
    });

    const pdvs = await arca.electronicBillingService.getSalesPoints();
    
    return {
      ok: true,
      puntosDeVenta: Array.isArray(pdvs) ? pdvs : ((pdvs as any).ResultGet || [pdvs]),
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || 'Error desconocido al conectar con ARCA',
    };
  }
}
