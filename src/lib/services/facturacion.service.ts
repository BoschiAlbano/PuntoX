/**
 * Servicio orquestador de facturación electrónica.
 * Coordina la creación de comprobantes locales con la autorización ARCA.
 */

import prisma from '@/DB/prisma';
import {
  getArcaConfig,
  getPuntoVentaSucursal,
  getUltimoComprobanteAutorizado,
  autorizarVoucher,
  type ArcaConfig,
  type VoucherData,
  type AutorizarComprobanteResult,
} from './arca.service';
import {
  TIPO_COMPROBANTE_LOCAL_A_AFIP,
  CONCEPTO_AFIP,
  MONEDA_LOCAL_A_AFIP,
  PORCENTAJE_IVA_A_AFIP,
  ESTADO_FACTURA_ELECTRONICA,
  RESULTADO_AFIP,
  DOC_TIPO_AFIP,
  requiereAutorizacionAfip,
} from '@/lib/constants/afip';

// Interface for the comprobante data we need from the existing system
interface ComprobanteConDetalle {
  Id: bigint;
  TenantId: bigint;
  SucursalId: bigint | null;
  TipoComprobante: number;
  Numero: number;
  Fecha: Date;
  SubTotal: any; // Decimal
  Total: any;    // Decimal
  Iva21: any;    // Decimal
  Iva105: any;   // Decimal
  Descuento: any; // Decimal
  Comprobante_Factura?: {
    ClienteId: bigint;
    Persona_Cliente: {
      CondicionIvaId: bigint;
      Persona: {
        Dni: string | null;
      };
    };
  } | null;
  DetalleComprobante: Array<{
    Cantidad: any;
    Precio: any;
    SubTotal: any;
    Iva: any;
    Articulo: {
      Iva: {
        Porcentaje: any;
      };
    };
  }>;
}

/**
 * Verifica si la facturación electrónica está habilitada para un tenant.
 */
export async function isFacturacionElectronicaHabilitada(tenantId: bigint): Promise<boolean> {
  const config = await prisma.configuracion.findFirst({
    where: {
      TenantId: tenantId,
      EstaEliminado: false,
    },
    select: {
      AfipHabilitado: true,
      AfipCertificado: true,
      AfipClavePrivada: true,
    },
  });

  return !!(config?.AfipHabilitado && config?.AfipCertificado && config?.AfipClavePrivada);
}

/**
 * Autoriza un comprobante existente contra ARCA.
 * Este es el flujo principal que se llama desde la creación de comprobantes.
 */
export async function autorizarComprobante(
  comprobanteId: bigint,
  tenantId: bigint,
  sucursalId: bigint,
): Promise<AutorizarComprobanteResult> {
  // 1. Obtener configuración ARCA
  const arcaConfig = await getArcaConfig(tenantId);
  if (!arcaConfig) {
    return {
      success: false,
      errores: 'La facturación electrónica no está configurada. Configure el certificado AFIP en Configuración → Fiscal.',
    };
  }

  // 2. Obtener punto de venta de la sucursal
  const puntoVenta = await getPuntoVentaSucursal(tenantId, sucursalId);
  if (!puntoVenta) {
    return {
      success: false,
      errores: 'La sucursal no tiene un Punto de Venta AFIP asignado. Configure el PDV en Configuración → Fiscal.',
    };
  }

  // 3. Obtener datos del comprobante con sus detalles
  const comprobante = await prisma.comprobante.findFirst({
    where: {
      Id: comprobanteId,
      TenantId: tenantId,
      EstaEliminado: false,
    },
    include: {
      Comprobante_Factura: {
        include: {
          Persona_Cliente: {
            include: {
              Persona: {
                select: { Dni: true },
              },
            },
          },
        },
      },
      DetalleComprobante: {
        where: { EstaEliminado: false },
        include: {
          Articulo: {
            include: {
              Iva: true,
            },
          },
        },
      },
    },
  }) as unknown as ComprobanteConDetalle | null;

  if (!comprobante) {
    return {
      success: false,
      errores: 'Comprobante no encontrado.',
    };
  }

  // 4. Determinar tipo de comprobante AFIP
  const cbteTipoAfip = TIPO_COMPROBANTE_LOCAL_A_AFIP[comprobante.TipoComprobante];
  if (!cbteTipoAfip) {
    return {
      success: false,
      errores: `Tipo de comprobante local ${comprobante.TipoComprobante} no tiene mapeo AFIP.`,
    };
  }

  // 5. Obtener último número autorizado por ARCA
  let ultimoNumero: number;
  try {
    ultimoNumero = await getUltimoComprobanteAutorizado(arcaConfig, puntoVenta, cbteTipoAfip);
  } catch (error: any) {
    return {
      success: false,
      errores: `Error al consultar último comprobante ARCA: ${error.message}`,
    };
  }

  const nuevoNumero = ultimoNumero + 1;

  // 6. Preparar datos para ARCA
  const voucherData = prepararDatosAfip(
    comprobante,
    cbteTipoAfip,
    puntoVenta,
    nuevoNumero,
  );

  // 7. Autorizar con ARCA
  const resultado = await autorizarVoucher(arcaConfig, voucherData);

  // 8. Guardar resultado en FacturaElectronica (upsert para evitar duplicados en reintentos)
  const facturaElectronica = await prisma.facturaElectronica.upsert({
    where: {
      TenantId_PuntoVenta_CbteTipo_CbteNumero: {
        TenantId: tenantId,
        PuntoVenta: puntoVenta,
        CbteTipo: cbteTipoAfip,
        CbteNumero: nuevoNumero,
      },
    },
    update: {
      CAE: resultado.CAE || null,
      CAEFchVto: resultado.CAEFchVto ? parseFechaAfip(resultado.CAEFchVto) : null,
      Estado: resultado.Resultado === RESULTADO_AFIP.APROBADO
        ? ESTADO_FACTURA_ELECTRONICA.AUTORIZADO
        : ESTADO_FACTURA_ELECTRONICA.RECHAZADO,
      Resultado: resultado.Resultado,
      Observaciones: resultado.Observaciones || resultado.Errores || null,
      ResponseXml: JSON.stringify(resultado),
    },
    create: {
      TenantId: tenantId,
      ComprobanteId: comprobanteId,
      SucursalId: sucursalId,
      CbteTipo: cbteTipoAfip,
      CbteNumero: nuevoNumero,
      PuntoVenta: puntoVenta,
      Concepto: CONCEPTO_AFIP.PRODUCTOS,
      DocTipo: voucherData.DocTipo,
      DocNro: String(voucherData.DocNro),
      ImpTotal: Number(comprobante.Total),
      ImpNeto: voucherData.ImpNeto,
      ImpIva: voucherData.ImpIVA,
      ImpTrib: 0,
      ImpOpEx: 0,
      ImpTotConc: 0,
      MonId: voucherData.MonId,
      MonCotiz: voucherData.MonCotiz,
      CAE: resultado.CAE || null,
      CAEFchVto: resultado.CAEFchVto ? parseFechaAfip(resultado.CAEFchVto) : null,
      Estado: resultado.Resultado === RESULTADO_AFIP.APROBADO
        ? ESTADO_FACTURA_ELECTRONICA.AUTORIZADO
        : ESTADO_FACTURA_ELECTRONICA.RECHAZADO,
      Resultado: resultado.Resultado,
      Observaciones: resultado.Observaciones || resultado.Errores || null,
      RequestXml: JSON.stringify(voucherData),
      ResponseXml: JSON.stringify(resultado),
      Detalles: {
        create: (voucherData.Iva || []).map((iva) => ({
          IvaAfipId: iva.Id,
          BaseImponible: iva.BaseImp,
          Importe: iva.Importe,
        })),
      },
    },
  });

  const success = resultado.Resultado === RESULTADO_AFIP.APROBADO;

  return {
    success,
    cae: resultado.CAE || undefined,
    caeFchVto: resultado.CAEFchVto || undefined,
    cbteNumero: nuevoNumero,
    resultado: resultado.Resultado,
    observaciones: resultado.Observaciones,
    errores: resultado.Errores,
    facturaElectronicaId: facturaElectronica.Id,
  };
}

/**
 * Prepara los datos del comprobante en el formato que requiere ARCA (WSFEv1).
 */
function prepararDatosAfip(
  comprobante: ComprobanteConDetalle,
  cbteTipoAfip: number,
  puntoVenta: number,
  cbteNumero: number,
): VoucherData {

  // Determinar documento del receptor
  let docTipo: number = DOC_TIPO_AFIP.SIN_IDENTIFICAR;
  let docNro = 0;

  const clienteData = comprobante.Comprobante_Factura?.Persona_Cliente;
  let condicionIva = 6; // CONSUMIDOR_FINAL por defecto
  
  if (clienteData?.CondicionIvaId) {
    condicionIva = Number(clienteData.CondicionIvaId);
  }

  if (clienteData?.Persona?.Dni) {
    const dni = clienteData.Persona.Dni.replace(/[^\d]/g, '');
    if (dni.length === 11) {
      docTipo = DOC_TIPO_AFIP.CUIT;
      docNro = Number(dni);
    } else if (dni.length >= 7 && dni.length <= 8) {
      docTipo = DOC_TIPO_AFIP.DNI;
      docNro = Number(dni);
    }
  }

  // Formatear fecha YYYYMMDD
  const fecha = comprobante.Fecha;
  const cbteFch = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}`;

  // Calcular IVA por alícuota
  const ivaMap = new Map<number, { baseImp: number; importe: number }>();

  for (const detalle of comprobante.DetalleComprobante) {
    const porcentaje = Number(detalle.Articulo.Iva.Porcentaje);
    const porcentajeStr = porcentaje.toString();
    const afipIvaId = PORCENTAJE_IVA_A_AFIP[porcentajeStr];

    if (afipIvaId) {
      const existing = ivaMap.get(afipIvaId) || { baseImp: 0, importe: 0 };
      const subtotal = Number(detalle.SubTotal);
      // Base imponible = subtotal sin IVA
      const baseImp = porcentaje > 0 ? subtotal / (1 + porcentaje / 100) : subtotal;
      // Importe IVA = base * tasa (NO usar detalle.Iva que puede ser otro campo)
      const importe = Math.round(baseImp * porcentaje) / 100;
      existing.baseImp += baseImp;
      existing.importe += importe;
      ivaMap.set(afipIvaId, existing);
    }
  }

  const ivaArray = Array.from(ivaMap.entries()).map(([id, entry]) => ({
    Id: id,
    BaseImp: Math.round(entry.baseImp * 100) / 100,
    Importe: Math.round(entry.importe * 100) / 100,
  }));

  // ImpNeto = suma de BaseImp (no Total - IVA, porque hay diferencias de redondeo)
  const impNeto = Math.round(
    ivaArray.reduce((acc, iva) => acc + iva.BaseImp, 0) * 100
  ) / 100;

  // ImpIVA = suma exacta de Importe (mismo valor que ARCA va a validar)
  const impIvaTotal = Math.round(
    ivaArray.reduce((acc, iva) => acc + iva.Importe, 0) * 100
  ) / 100;

  // ImpTotal viene del comprobante (precio con IVA incluido)
  const total = Math.round(Number(comprobante.Total) * 100) / 100;

  const data: VoucherData = {
    CantReg: 1,
    PtoVta: puntoVenta,
    CbteTipo: cbteTipoAfip,
    Concepto: CONCEPTO_AFIP.PRODUCTOS,
    DocTipo: docTipo,
    DocNro: docNro,
    CbteDesde: cbteNumero,
    CbteHasta: cbteNumero,
    CbteFch: cbteFch,
    ImpTotal: total,
    ImpTotConc: 0,
    ImpNeto: impNeto,
    ImpOpEx: 0,
    ImpIVA: impIvaTotal,
    ImpTrib: 0,
    MonId: 'PES',
    MonCotiz: 1,
    CondicionIVAReceptorId: condicionIva,
  };

  // Solo agregar array de IVA si hay alícuotas (requerido para Factura A)
  if (ivaArray.length > 0) {
    data.Iva = ivaArray;
  }

  return data;
}

/**
 * Parsea una fecha en formato AFIP (YYYYMMDD) a Date.
 */
function parseFechaAfip(fechaStr: string): Date {
  if (!fechaStr || fechaStr.length !== 8) {
    return new Date();
  }
  const year = parseInt(fechaStr.substring(0, 4));
  const month = parseInt(fechaStr.substring(4, 6)) - 1; // 0-indexed
  const day = parseInt(fechaStr.substring(6, 8));
  return new Date(year, month, day);
}
