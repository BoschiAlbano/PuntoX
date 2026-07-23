/**
 * Servicio orquestador de facturación electrónica.
 * Coordina la creación de comprobantes locales con la autorización ARCA.
 */

import prisma from "@/DB/prisma";
import {
  getArcaConfig,
  getPuntoVentaSucursal,
  getUltimoComprobanteAutorizado,
  autorizarVoucher,
  interpretarErrorArca,
  type ArcaConfig,
  type VoucherData,
  type AutorizarComprobanteResult,
} from "./arca.service";
import {
  TIPO_COMPROBANTE_LOCAL_A_AFIP,
  CBTE_TIPO_AFIP,
  CONCEPTO_AFIP,
  MONEDA_LOCAL_A_AFIP,
  PORCENTAJE_IVA_A_AFIP,
  ESTADO_FACTURA_ELECTRONICA,
  RESULTADO_AFIP,
  DOC_TIPO_AFIP,
  CONDICION_IVA_AFIP,
  CONDICION_IVA_LOCAL_TO_AFIP,
  requiereAutorizacionAfip,
  getCbteTipoNotaCredito,
} from "@/lib/constants/afip";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";
import { planIncluyeAFIP } from "@/lib/planes/features";

// Interface for the comprobante data we need from the existing system
interface ComprobanteConDetalle {
  Id: bigint;
  TenantId: bigint;
  SucursalId: bigint | null;
  TipoComprobante: number;
  Numero: number;
  Fecha: Date;
  SubTotal: any; // Decimal
  Total: any; // Decimal
  Iva21: any; // Decimal
  Iva105: any; // Decimal
  Descuento: any; // Decimal
  Comprobante_Factura?: {
    ClienteId: bigint;
    Persona_Cliente: {
      CondicionIvaId: bigint;
      CondicionIva?: {
        Descripcion: string;
      };
      Persona: {
        Dni: string | null;
      };
    };
  } | null;
  // Presente solo cuando el comprobante es una Nota de Crédito: apunta a la
  // factura que se está acreditando (para tomar su cliente y verificar que
  // ya haya sido autorizada por AFIP antes de declarar la NC).
  Comprobante_NotaCredito_Comprobante_NotaCredito_IdToComprobante?: {
    ComprobanteId: bigint;
    Comprobante_Comprobante_NotaCredito_ComprobanteIdToComprobante: {
      TipoComprobante: number;
      Comprobante_Factura?: {
        ClienteId: bigint;
        Persona_Cliente: {
          CondicionIvaId: bigint;
          CondicionIva?: {
            Descripcion: string;
          };
          Persona: {
            Dni: string | null;
          };
        };
      } | null;
      FacturaElectronica?: {
        Estado: string;
        PuntoVenta: number;
        CbteNumero: number;
      } | null;
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
 * Si el comprobante es una Nota de Crédito, devuelve los datos de la
 * factura que está acreditando (tipo, cliente, y su FacturaElectronica ya
 * autorizada por AFIP). Devuelve null para cualquier otro tipo, o si la NC
 * no tiene la relación cargada.
 */
function resolverFacturaAsociadaNotaCredito(comprobante: ComprobanteConDetalle) {
  return (
    comprobante.Comprobante_NotaCredito_Comprobante_NotaCredito_IdToComprobante
      ?.Comprobante_Comprobante_NotaCredito_ComprobanteIdToComprobante ?? null
  );
}

/**
 * Verifica si la facturación electrónica está habilitada para un tenant.
 */
export async function isFacturacionElectronicaHabilitada(
  tenantId: bigint,
): Promise<boolean> {
  const [config, incluyeAFIP] = await Promise.all([
    prisma.configuracion.findFirst({
      where: {
        TenantId: tenantId,
        EstaEliminado: false,
      },
      select: {
        AfipHabilitado: true,
        AfipCertificado: true,
        AfipClavePrivada: true,
      },
    }),
    planIncluyeAFIP(Number(tenantId)),
  ]);

  if (!incluyeAFIP) return false;

  return !!(
    config?.AfipHabilitado &&
    config?.AfipCertificado &&
    config?.AfipClavePrivada
  );
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
      errores:
        "La facturación electrónica no está configurada. Configure el certificado AFIP en Configuración → Fiscal.",
    };
  }

  // 2. Obtener punto de venta de la sucursal
  const puntoVenta = await getPuntoVentaSucursal(tenantId, sucursalId);
  if (!puntoVenta) {
    return {
      success: false,
      errores:
        "La sucursal no tiene un Punto de Venta AFIP asignado. Configure el PDV en Configuración → Fiscal.",
    };
  }

  // 3. Obtener datos del comprobante con sus detalles
  const comprobante = (await prisma.comprobante.findFirst({
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
              CondicionIva: {
                select: { Descripcion: true },
              },
            },
          },
        },
      },
      Comprobante_NotaCredito_Comprobante_NotaCredito_IdToComprobante: {
        include: {
          Comprobante_Comprobante_NotaCredito_ComprobanteIdToComprobante: {
            include: {
              Comprobante_Factura: {
                include: {
                  Persona_Cliente: {
                    include: {
                      Persona: {
                        select: { Dni: true },
                      },
                      CondicionIva: {
                        select: { Descripcion: true },
                      },
                    },
                  },
                },
              },
              FacturaElectronica: {
                select: { Estado: true, PuntoVenta: true, CbteNumero: true },
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
  })) as unknown as ComprobanteConDetalle | null;

  if (!comprobante) {
    return {
      success: false,
      errores: "Comprobante no encontrado.",
    };
  }

  // 4. Determinar tipo de comprobante AFIP
  // La Nota de Crédito no tiene un código AFIP propio: la letra (A/B/C)
  // depende de la factura que se está acreditando.
  const esNotaCredito =
    comprobante.TipoComprobante === TIPO_COMPROBANTE_VENTA.NOTA_CREDITO;
  const facturaAsociada = resolverFacturaAsociadaNotaCredito(comprobante);

  let cbteTipoAfip: number | undefined;
  if (esNotaCredito) {
    if (!facturaAsociada) {
      return {
        success: false,
        errores:
          "Esta Nota de Crédito no tiene una factura asociada registrada.",
      };
    }
    cbteTipoAfip =
      getCbteTipoNotaCredito(facturaAsociada.TipoComprobante) ?? undefined;
    if (!cbteTipoAfip) {
      return {
        success: false,
        errores: `La factura asociada (tipo ${facturaAsociada.TipoComprobante}) no admite Nota de Crédito electrónica.`,
      };
    }
    if (facturaAsociada.FacturaElectronica?.Estado !== ESTADO_FACTURA_ELECTRONICA.AUTORIZADO) {
      return {
        success: false,
        errores:
          "No se puede emitir la Nota de Crédito electrónica: la factura asociada no fue autorizada por AFIP.",
      };
    }
  } else {
    cbteTipoAfip = TIPO_COMPROBANTE_LOCAL_A_AFIP[comprobante.TipoComprobante];
  }

  if (!cbteTipoAfip) {
    return {
      success: false,
      errores: `Tipo de comprobante local ${comprobante.TipoComprobante} no tiene mapeo AFIP.`,
    };
  }

  // Revisar si ya existe un registro de FacturaElectronica
  let facturaElectronica = await prisma.facturaElectronica.findUnique({
    where: { ComprobanteId: comprobanteId },
  });

  if (
    facturaElectronica?.CAE &&
    facturaElectronica.Estado === ESTADO_FACTURA_ELECTRONICA.AUTORIZADO
  ) {
    return {
      success: true,
      cae: facturaElectronica.CAE,
      caeFchVto: facturaElectronica.CAEFchVto?.toISOString() || undefined,
      cbteNumero: facturaElectronica.CbteNumero,
      resultado: RESULTADO_AFIP.APROBADO,
      facturaElectronicaId: facturaElectronica.Id,
    };
  }

  // 5. Obtener último número autorizado por ARCA
  let ultimoNumero: number;
  try {
    ultimoNumero = await getUltimoComprobanteAutorizado(
      arcaConfig,
      puntoVenta,
      cbteTipoAfip,
    );
  } catch (error: any) {
    return {
      success: false,
      errores: `Error al consultar último comprobante ARCA: ${error.message}`,
    };
  }

  // =========================================================================
  // PREVENCIÓN DE FALSOS NEGATIVOS (Recuperación de CAE)
  // =========================================================================
  if (
    facturaElectronica &&
    facturaElectronica.Estado === ESTADO_FACTURA_ELECTRONICA.PENDIENTE
  ) {
    if (ultimoNumero >= facturaElectronica.CbteNumero) {
      // AFIP procesó algún comprobante posterior al que intentamos, o el mismo.
      // Importamos getVoucherInfo dinámicamente si no está (aunque lo agregamos en arca.service)
      const { getVoucherInfo } = await import("./arca.service");
      const voucherInfo = await getVoucherInfo(
        arcaConfig,
        puntoVenta,
        cbteTipoAfip,
        facturaElectronica.CbteNumero,
      );

      // AFIP retorna el comprobante. Verificamos si el ImpTotal coincide (es decir, es nuestro)
      // La propiedad suele venir como ImpTotal en la respuesta.
      const impTotalAfip = voucherInfo?.ResultGet?.ImpTotal;
      const codAutorizacion = voucherInfo?.ResultGet?.CodAutorizacion;
      const fchVto = voucherInfo?.ResultGet?.FchVto;

      if (
        impTotalAfip &&
        Number(impTotalAfip) === Number(comprobante.Total) &&
        codAutorizacion
      ) {
        // ¡Era nuestro! Recuperamos el CAE.
        facturaElectronica = await prisma.facturaElectronica.update({
          where: { Id: facturaElectronica.Id },
          data: {
            CAE: codAutorizacion,
            CAEFchVto: fchVto ? parseFechaAfip(fchVto) : null,
            Estado: ESTADO_FACTURA_ELECTRONICA.AUTORIZADO,
            Resultado: RESULTADO_AFIP.APROBADO,
            Observaciones: "CAE Recuperado por sistema (Falso Negativo)",
            ResponseXml: JSON.stringify(voucherInfo),
          },
        });

        return {
          success: true,
          cae: codAutorizacion,
          caeFchVto: fchVto,
          cbteNumero: facturaElectronica.CbteNumero,
          resultado: RESULTADO_AFIP.APROBADO,
          observaciones: "CAE Recuperado por sistema (Falso Negativo)",
          facturaElectronicaId: facturaElectronica.Id,
        };
      }
    }
  }

  // 6. Limpiar FE stale y preparar nuevo número
  // Si existe una FE previa no autorizada para este comprobante, eliminarla
  if (
    facturaElectronica &&
    facturaElectronica.Estado !== ESTADO_FACTURA_ELECTRONICA.AUTORIZADO
  ) {
    await prisma.facturaElectronicaIva.deleteMany({
      where: { FacturaElectronicaId: facturaElectronica.Id },
    });
    await prisma.facturaElectronica.delete({
      where: { Id: facturaElectronica.Id },
    });
    facturaElectronica = null;
  }
  const nuevoNumero = ultimoNumero + 1;

  // Eliminar FEs huérfanas de otros comprobantes que ocupen este número
  const feConflicto = await prisma.facturaElectronica.findFirst({
    where: {
      TenantId: tenantId,
      PuntoVenta: puntoVenta,
      CbteTipo: cbteTipoAfip,
      CbteNumero: nuevoNumero,
      Estado: { not: ESTADO_FACTURA_ELECTRONICA.AUTORIZADO },
    },
  });
  if (feConflicto) {
    await prisma.facturaElectronicaIva.deleteMany({
      where: { FacturaElectronicaId: feConflicto.Id },
    });
    await prisma.facturaElectronica.delete({
      where: { Id: feConflicto.Id },
    });
  }
  const voucherData = prepararDatosAfip(
    comprobante,
    cbteTipoAfip,
    puntoVenta,
    nuevoNumero,
    arcaConfig.cuit,
    facturaAsociada,
  );

  // 7. GUARDAR COMO PENDIENTE ANTES DE ENVIAR A ARCA (Protección contra cortes)
  if (facturaElectronica) {
    facturaElectronica = await prisma.facturaElectronica.update({
      where: { Id: facturaElectronica.Id },
      data: {
        CbteNumero: nuevoNumero,
        Estado: ESTADO_FACTURA_ELECTRONICA.PENDIENTE,
        Reprocesado: true,
        RequestXml: JSON.stringify(voucherData),
        Observaciones: null,
      },
    });
  } else {
    facturaElectronica = await prisma.facturaElectronica.create({
      data: {
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
        Estado: ESTADO_FACTURA_ELECTRONICA.PENDIENTE,
        RequestXml: JSON.stringify(voucherData),
        Detalles: {
          create: (voucherData.Iva || []).map((iva) => ({
            IvaAfipId: iva.Id,
            BaseImponible: iva.BaseImp,
            Importe: iva.Importe,
          })),
        },
      },
    });
  }

  // 8. Llamar a ARCA con Try-Catch para que nunca falle arrojando un throw
  let resultado;
  try {
    resultado = await autorizarVoucher(arcaConfig, voucherData);
  } catch (error: any) {
    return {
      success: false,
      errores: `Error de conexión con ARCA/AFIP: ${interpretarErrorArca(error.message)}. El comprobante quedó PENDIENTE.`,
      facturaElectronicaId: facturaElectronica.Id,
    };
  }

  // 9. Actualizar registro final con la respuesta
  facturaElectronica = await prisma.facturaElectronica.update({
    where: { Id: facturaElectronica.Id },
    data: {
      CAE: resultado.CAE || null,
      CAEFchVto: resultado.CAEFchVto
        ? parseFechaAfip(resultado.CAEFchVto)
        : null,
      Estado:
        resultado.Resultado === RESULTADO_AFIP.APROBADO
          ? ESTADO_FACTURA_ELECTRONICA.AUTORIZADO
          : ESTADO_FACTURA_ELECTRONICA.RECHAZADO,
      Resultado: resultado.Resultado,
      Observaciones: resultado.Observaciones || resultado.Errores || null,
      ResponseXml: JSON.stringify(resultado),
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
  cuitEmisor: number,
  facturaAsociada: ReturnType<typeof resolverFacturaAsociadaNotaCredito>,
): VoucherData {
  // Determinar documento del receptor
  let docTipo: number = DOC_TIPO_AFIP.SIN_IDENTIFICAR;
  let docNro = 0;

  // El cliente de una Nota de Crédito es el mismo de la factura que
  // acredita: la NC en sí no tiene Comprobante_Factura propio.
  const clienteData =
    comprobante.Comprobante_Factura?.Persona_Cliente ??
    facturaAsociada?.Comprobante_Factura?.Persona_Cliente;
  let condicionIva: number = CONDICION_IVA_AFIP.CONSUMIDOR_FINAL;

  if (clienteData?.CondicionIva?.Descripcion) {
    const desc = clienteData.CondicionIva.Descripcion.toLowerCase();
    condicionIva = CONDICION_IVA_LOCAL_TO_AFIP[desc] ?? condicionIva;
  }

  const esConsumidorFinal =
    condicionIva === CONDICION_IVA_AFIP.CONSUMIDOR_FINAL;

  // Para Consumidor Final: DocTipo=99, DocNro=0 (sin identificar)
  // ARCA rechaza si se envía DNI/CUIT con condición Consumidor Final
  if (!esConsumidorFinal && clienteData?.Persona?.Dni) {
    const dni = clienteData.Persona.Dni.replace(/[^\d]/g, "");
    if (dni.length === 11) {
      docTipo = DOC_TIPO_AFIP.CUIT;
      docNro = Number(dni);
    } else if (dni.length >= 7 && dni.length <= 8) {
      docTipo = DOC_TIPO_AFIP.DNI;
      docNro = Number(dni);
    }
  }

  // Formatear fecha YYYYMMDD (en UTC para consistencia)
  // toISOString() devuelve siempre en UTC como YYYY-MM-DD
  const fecha = comprobante.Fecha;
  const fechaIso = fecha.toISOString().split("T")[0]; // "2026-06-23"
  const cbteFch = fechaIso.replace(/-/g, ""); // "20260623"

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
      const baseImp =
        porcentaje > 0 ? subtotal / (1 + porcentaje / 100) : subtotal;
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
  const impNeto =
    Math.round(ivaArray.reduce((acc, iva) => acc + iva.BaseImp, 0) * 100) / 100;

  // ImpIVA = suma exacta de Importe (mismo valor que ARCA va a validar)
  const impIvaTotal =
    Math.round(ivaArray.reduce((acc, iva) => acc + iva.Importe, 0) * 100) / 100;

  // ImpTotal viene del comprobante (precio con IVA incluido)
  const total = Math.round(Number(comprobante.Total) * 100) / 100;

  /**
   * Factura C (CbteTipo 11, 12, 13): el emisor es monotributista.
   * AFIP exige ImpIVA = 0, ImpNeto = ImpTotal y sin array Iva.
   * Factura A/B: se discrimina IVA normalmente.
   */
  const esComprobanteC = [
    CBTE_TIPO_AFIP.FACTURA_C,
    CBTE_TIPO_AFIP.NOTA_DEBITO_C,
    CBTE_TIPO_AFIP.NOTA_CREDITO_C,
  ].includes(cbteTipoAfip as any);

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
    ImpNeto: esComprobanteC ? total : impNeto,
    ImpOpEx: 0,
    ImpIVA: esComprobanteC ? 0 : impIvaTotal,
    ImpTrib: 0,
    MonId: "PES",
    MonCotiz: 1,
    CondicionIVAReceptorId: condicionIva,
  };

  // Array Iva solo para Factura A/B (comprobantes con IVA discriminado)
  if (!esComprobanteC && ivaArray.length > 0) {
    data.Iva = ivaArray;
  }

  // Comprobantes asociados: obligatorio para Notas de Crédito, referencia
  // a la factura que se está acreditando con el PtoVta/Nro con los que
  // ARCA ya la autorizó (no el número interno del sistema). OJO: "Tipo" acá
  // es el código AFIP de la FACTURA original (ej. 11 = Factura C), no el de
  // la Nota de Crédito (ej. 13 = NC-C) — son campos distintos aunque ambos
  // salgan del mismo tipo local de comprobante.
  if (facturaAsociada?.FacturaElectronica) {
    const cbteTipoFacturaAsociada =
      TIPO_COMPROBANTE_LOCAL_A_AFIP[facturaAsociada.TipoComprobante];
    data.CbtesAsoc = [
      {
        Tipo: cbteTipoFacturaAsociada,
        PtoVta: facturaAsociada.FacturaElectronica.PuntoVenta,
        Nro: facturaAsociada.FacturaElectronica.CbteNumero,
        Cuit: String(cuitEmisor),
      },
    ];
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
