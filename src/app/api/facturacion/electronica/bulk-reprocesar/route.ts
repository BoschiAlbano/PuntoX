import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";
import {
  isFacturacionElectronicaHabilitada,
  autorizarComprobante,
} from "@/lib/services/facturacion.service";
import {
  getArcaConfig,
  getUltimoComprobanteAutorizado,
} from "@/lib/services/arca.service";
import { TIPO_COMPROBANTE_LOCAL_A_AFIP } from "@/lib/constants/afip";
import { parseArcaObservations } from "@/lib/constants/arca-errors";

/**
 * Parsea una fecha en formato YYYY-MM-DD a un objeto Date en UTC
 * Esto evita problemas de timezone al interpretar "2026-06-23" como medianoche UTC
 */
function parseDateFromString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({ req });
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantIdBigInt = BigInt(tenantId);

    const body = await req.json();
    const { comprobantesIds, fecha, tipoComprobante } = body;

    if (!Array.isArray(comprobantesIds) || comprobantesIds.length === 0) {
      return NextResponse.json(
        { error: "Debe proporcionar una lista de IDs de comprobantes" },
        { status: 400 },
      );
    }

    let fechaUniforme: Date | null = null;
    if (fecha) {
      try {
        fechaUniforme = parseDateFromString(fecha);
        if (isNaN(fechaUniforme.getTime())) {
          return NextResponse.json(
            { error: "Fecha inválida" },
            { status: 400 },
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: `Fecha inválida: ${fecha}. Debe ser en formato YYYY-MM-DD` },
          { status: 400 },
        );
      }
    }

    const arcaHabilitada =
      await isFacturacionElectronicaHabilitada(tenantIdBigInt);
    if (!arcaHabilitada) {
      return NextResponse.json(
        {
          error:
            "La facturación electrónica no está habilitada o faltan certificados",
        },
        { status: 400 },
      );
    }

    const userDb = await prisma.usuario.findFirst({
      where: { TenantId: tenantIdBigInt, EstaEliminado: false },
      include: { Sucursales: { take: 1 } },
    });
    const defaultSucursalId = userDb?.Sucursales[0]?.SucursalId;

    const resultados: any[] = [];
    let exitosos = 0;
    let fallidos = 0;
    const comprobantesFallidos: {
      comprobanteId: bigint;
      sucursalId: bigint;
      errorMessage: string;
    }[] = [];

    for (const id of comprobantesIds) {
      const comprobanteId = BigInt(id);

      const comprobante = await prisma.comprobante.findUnique({
        where: {
          Id: comprobanteId,
          TenantId: tenantIdBigInt,
        },
        include: {
          FacturaElectronica: true,
        },
      });

      if (!comprobante) {
        resultados.push({
          id,
          status: "error",
          message: "Comprobante no encontrado",
        });
        fallidos++;
        continue;
      }

      if (comprobante.FacturaElectronica?.Estado === "AUTORIZADO") {
        resultados.push({ id, status: "skipped", message: "Ya autorizado" });
        continue;
      }

      const sucursalId = comprobante.SucursalId || defaultSucursalId;

      if (!sucursalId) {
        resultados.push({
          id,
          status: "error",
          message: "Sin sucursal asignada",
        });
        fallidos++;
        continue;
      }

      if (fechaUniforme) {
        await prisma.comprobante.update({
          where: { Id: comprobanteId },
          data: { Fecha: fechaUniforme },
        });
      }

      if (tipoComprobante) {
        await prisma.comprobante.update({
          where: { Id: comprobanteId },
          data: { TipoComprobante: tipoComprobante },
        });
        comprobante.TipoComprobante = tipoComprobante;
      }

      if (comprobante.FacturaElectronica) {
        await prisma.facturaElectronicaIva.deleteMany({
          where: { FacturaElectronicaId: comprobante.FacturaElectronica.Id },
        });
        await prisma.facturaElectronica.delete({
          where: { Id: comprobante.FacturaElectronica.Id },
        });
      }

      let result;
      try {
        result = await autorizarComprobante(
          comprobanteId,
          tenantIdBigInt,
          sucursalId,
        );
      } catch (err: any) {
        if (err.code === "P2002") {
          console.error(
            `[bulk-reprocesar] P2002 comprobante ${id}, limpiando FEs conflictivas y reintentando...`,
          );

          const cbteTipoAfip =
            TIPO_COMPROBANTE_LOCAL_A_AFIP[comprobante.TipoComprobante];
          if (cbteTipoAfip) {
            let puntoVenta = 1;
            const cfg = await prisma.configuracion.findFirst({
              where: { TenantId: tenantIdBigInt },
            });
            if (cfg?.PuntoVenta) puntoVenta = Number(cfg.PuntoVenta);

            const conflictingFes = await prisma.facturaElectronica.findMany({
              where: {
                TenantId: tenantIdBigInt,
                CbteTipo: cbteTipoAfip,
                PuntoVenta: puntoVenta,
                Estado: { not: "AUTORIZADO" },
                ComprobanteId: { not: comprobanteId },
              },
            });
            for (const fe of conflictingFes) {
              await prisma.facturaElectronicaIva.deleteMany({
                where: { FacturaElectronicaId: fe.Id },
              });
              await prisma.facturaElectronica.delete({
                where: { Id: fe.Id },
              });
            }
            console.log(
              `[bulk-reprocesar] Eliminadas ${conflictingFes.length} FEs conflictivas para tipo ${cbteTipoAfip} PDV ${puntoVenta}`,
            );

            try {
              result = await autorizarComprobante(
                comprobanteId,
                tenantIdBigInt,
                sucursalId,
              );
            } catch (retryErr: any) {
              console.error(
                `[bulk-reprocesar] Retry también falló comprobante ${id}:`,
                retryErr.message,
              );
              const errorMsg =
                retryErr.code === "P2002"
                  ? "Conflicto de número de comprobante. Ya existe un comprobante con ese número en ARCA."
                  : `Error inesperado: ${retryErr.message}`;
              comprobantesFallidos.push({
                comprobanteId,
                sucursalId: BigInt(sucursalId),
                errorMessage: errorMsg,
              });
              resultados.push({ id, status: "error", message: errorMsg });
              fallidos++;
              continue;
            }
          } else {
            const errorMsg = "Tipo de comprobante sin mapeo AFIP";
            comprobantesFallidos.push({
              comprobanteId,
              sucursalId: BigInt(sucursalId),
              errorMessage: errorMsg,
            });
            resultados.push({ id, status: "error", message: errorMsg });
            fallidos++;
            continue;
          }
        } else {
          console.error(
            `[bulk-reprocesar] Error inesperado comprobante ${id}:`,
            err.message,
          );
          const errorMsg = `Error inesperado: ${err.message}`;
          comprobantesFallidos.push({
            comprobanteId,
            sucursalId: BigInt(sucursalId),
            errorMessage: errorMsg,
          });
          resultados.push({ id, status: "error", message: errorMsg });
          fallidos++;
          continue;
        }
      }

      if (result.success) {
        resultados.push({ id, status: "success", cae: result.cae });
        exitosos++;
      } else {
        const errorMsg = parseArcaObservations(
          result.errores || result.observaciones || "Rechazado por ARCA",
        );
        if (result.facturaElectronicaId) {
          await prisma.facturaElectronicaIva.deleteMany({
            where: { FacturaElectronicaId: result.facturaElectronicaId },
          });
          await prisma.facturaElectronica.delete({
            where: { Id: result.facturaElectronicaId },
          });
        }
        comprobantesFallidos.push({
          comprobanteId,
          sucursalId: BigInt(sucursalId),
          errorMessage: errorMsg,
        });
        resultados.push({
          id,
          status: "error",
          message: errorMsg,
        });
        fallidos++;
      }
    }

    for (const fallido of comprobantesFallidos) {
      const yaTieneFe = await prisma.facturaElectronica.findUnique({
        where: { ComprobanteId: fallido.comprobanteId },
      });
      if (!yaTieneFe) {
        const comp = await prisma.comprobante.findUnique({
          where: { Id: fallido.comprobanteId },
        });
        if (comp) {
          const cbteTipoAfip =
            TIPO_COMPROBANTE_LOCAL_A_AFIP[comp.TipoComprobante];
          if (cbteTipoAfip) {
            let puntoVenta = 1;
            const config = await prisma.configuracion.findFirst({
              where: { TenantId: tenantIdBigInt },
            });
            if (config?.PuntoVenta) {
              puntoVenta = Number(config.PuntoVenta);
            }
            let ultimoNumero = 0;
            try {
              const arcaConfig = await getArcaConfig(tenantIdBigInt);
              if (arcaConfig) {
                ultimoNumero = await getUltimoComprobanteAutorizado(
                  arcaConfig,
                  puntoVenta,
                  cbteTipoAfip,
                );
              }
            } catch {}

            // Buscar el máximo CbteNumero ya usado para este tipo/PDV en FE sintéticas
            const maxExistente = await prisma.facturaElectronica.aggregate({
              where: {
                TenantId: tenantIdBigInt,
                PuntoVenta: puntoVenta,
                CbteTipo: cbteTipoAfip,
              },
              _max: { CbteNumero: true },
            });
            const baseNumero = Math.max(
              ultimoNumero,
              maxExistente._max.CbteNumero || 0,
            );

            await prisma.facturaElectronica.create({
              data: {
                TenantId: tenantIdBigInt,
                ComprobanteId: fallido.comprobanteId,
                SucursalId: fallido.sucursalId,
                CbteTipo: cbteTipoAfip,
                CbteNumero: baseNumero + 1,
                PuntoVenta: puntoVenta,
                Concepto: 1,
                DocTipo: 99,
                DocNro: "0",
                ImpTotal: Number(comp.Total),
                ImpNeto: Number(comp.Total),
                ImpIva: 0,
                ImpTrib: 0,
                ImpOpEx: 0,
                ImpTotConc: 0,
                MonId: "PES",
                MonCotiz: 1,
                Estado: "RECHAZADO",
                Observaciones: fallido.errorMessage,
              },
            });
          }
        }
      }
    }

    return NextResponse.json(
      {
        message: "Proceso completado",
        resumen: { exitosos, fallidos, total: comprobantesIds.length },
        resultados,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleError(error);
  }
}
