import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import {
  TIPO_COMPROBANTE_VENTA,
  TIPO_PAGO,
} from "@/lib/constants/comprobantes";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.CLIENTES,
    });
    const tenantIdBigInt = BigInt(tenantId);

    const searchParams = req.nextUrl.searchParams;
    const busqueda = searchParams.get("q")?.trim() || "";

    const where: any = {
      TenantId: tenantIdBigInt,
      EstaEliminado: false,
      Persona_Cliente: { isNot: null },
    };

    if (busqueda) {
      where.OR = [
        { Nombre: { contains: busqueda, mode: "insensitive" } },
        { Apellido: { contains: busqueda, mode: "insensitive" } },
        { Mail: { contains: busqueda, mode: "insensitive" } },
        { Dni: { contains: busqueda, mode: "insensitive" } },
      ];
    }

    // Limitamos a 50 resultados para ser eficientes en ventas
    const clientes = await prisma.persona.findMany({
      where,
      take: 50,
      select: {
        Id: true,
        Nombre: true,
        Apellido: true,
        Dni: true,
        Mail: true,
        Direccion: true,
        Persona_Cliente: {
          select: {
            Id: true,
            ActivarCtaCte: true,
            TieneLimiteCompra: true,
            MontoMaximoCtaCte: true,
            ListaPrecioId: true,
          },
        },
      },
      orderBy: {
        Apellido: "asc",
      },
    });

    // Solo calcular saldos para clientes con cuenta corriente activa
    const ctaCteClientes = clientes.filter(
      (c) => c.Persona_Cliente?.ActivarCtaCte,
    );
    const ctaCteClientIds = ctaCteClientes.map((c) => c.Id);

    // Traemos movimientos solo si hay clientes con CtaCte activa (optimización)
    const [ventasCtaCte, pagosCtaCte, notasCreditoCtaCte] =
      ctaCteClientIds.length > 0
        ? await Promise.all([
            // 1. Débitos (Ventas en Cta Cte)
            prisma.formaPago.findMany({
              where: {
                TenantId: tenantIdBigInt,
                TipoPago: TIPO_PAGO.CUENTA_CORRIENTE,
                OR: [
                  { FormaPago_CtaCte: { ClienteId: { in: ctaCteClientIds } } },
                  {
                    Comprobante: {
                      Comprobante_Factura: { ClienteId: { in: ctaCteClientIds } },
                    },
                  },
                  {
                    Comprobante: {
                      Comprobante_Presupuesto: { ClienteId: { in: ctaCteClientIds } },
                    },
                  },
                  {
                    Comprobante: {
                      Comprobante_Remito: { ClienteId: { in: ctaCteClientIds } },
                    },
                  },
                ],
                Comprobante: {
                  TipoComprobante: {
                    in: [
                      TIPO_COMPROBANTE_VENTA.FACTURA_A,
                      TIPO_COMPROBANTE_VENTA.FACTURA_B,
                      TIPO_COMPROBANTE_VENTA.FACTURA_C,
                      TIPO_COMPROBANTE_VENTA.REMITO,
                    ],
                  },
                  EstaEliminado: false,
                },
                EstaEliminado: false,
              },
              select: {
                Monto: true,
                FormaPago_CtaCte: { select: { ClienteId: true } },
                Comprobante: {
                  select: {
                    Comprobante_Factura: { select: { ClienteId: true } },
                    Comprobante_Presupuesto: { select: { ClienteId: true } },
                    Comprobante_Remito: { select: { ClienteId: true } },
                  },
                },
              },
            }),

            // 2. Créditos (Pagos/Cobranzas)
            prisma.comprobante.findMany({
              where: {
                TenantId: tenantIdBigInt,
                TipoComprobante: TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE,
                Comprobante_CuentaCorriente: {
                  ClienteId: { in: ctaCteClientIds },
                },
                EstaEliminado: false,
              },
              select: {
                Total: true,
                Comprobante_CuentaCorriente: { select: { ClienteId: true } },
              },
            }),

            // 3. Créditos (Notas de Crédito a Cta Cte)
            prisma.formaPago.findMany({
              where: {
                TenantId: tenantIdBigInt,
                TipoPago: TIPO_PAGO.CUENTA_CORRIENTE,
                FormaPago_CtaCte: { ClienteId: { in: ctaCteClientIds } },
                Comprobante: {
                  TipoComprobante: TIPO_COMPROBANTE_VENTA.NOTA_CREDITO,
                  EstaEliminado: false,
                },
                EstaEliminado: false,
              },
              select: {
                Monto: true,
                FormaPago_CtaCte: { select: { ClienteId: true } },
              },
            }),
          ])
        : [[], [], []];
    // Procesar datos en memoria
    const saldosMap = new Map<string, number>();

    // Sumar Ventas (Deuda)
    ventasCtaCte.forEach((v) => {
      let cId = v.FormaPago_CtaCte?.ClienteId?.toString();

      // Fallback strategies for Client ID
      if (!cId) cId = v.Comprobante?.Comprobante_Factura?.ClienteId?.toString();
      if (!cId)
        cId = v.Comprobante?.Comprobante_Presupuesto?.ClienteId?.toString();
      if (!cId) cId = v.Comprobante?.Comprobante_Remito?.ClienteId?.toString();

      if (cId) {
        const current = saldosMap.get(cId) || 0;
        saldosMap.set(cId, current + Number(v.Monto));
      }
    });

    // Restar Pagos
    pagosCtaCte.forEach((p) => {
      const cId = p.Comprobante_CuentaCorriente?.ClienteId?.toString();
      if (cId) {
        const current = saldosMap.get(cId) || 0;
        saldosMap.set(cId, current - Number(p.Total));
      }
    });

    // Restar Notas de Crédito
    notasCreditoCtaCte.forEach((nc) => {
      const cId = nc.FormaPago_CtaCte?.ClienteId?.toString();
      if (cId) {
        const current = saldosMap.get(cId) || 0;
        saldosMap.set(cId, current - Number(nc.Monto));
      }
    });

    const response = clientes.map((c) => {
      const cIdStr = c.Id.toString();
      const saldo = saldosMap.get(cIdStr) || 0;
      const montoMaximo = c.Persona_Cliente?.MontoMaximoCtaCte
        ? Number(c.Persona_Cliente.MontoMaximoCtaCte)
        : 0;
      const tieneLimite = c.Persona_Cliente?.TieneLimiteCompra ?? false;

      return {
        id: Number(c.Id),
        nombre: c.Nombre,
        apellido: c.Apellido,
        nombreCompleto: `${c.Nombre} ${c.Apellido}`,
        dni: c.Dni,
        mail: c.Mail,
        direccion: c.Direccion,
        activarCtaCte: c.Persona_Cliente?.ActivarCtaCte ?? false,
        tieneLimiteCompra: tieneLimite,
        montoMaximoCtaCte: montoMaximo,
        ListaPrecioId: c.Persona_Cliente?.ListaPrecioId ? Number(c.Persona_Cliente.ListaPrecioId) : null,
        saldoActual: Number(saldo.toFixed(2)),
        margenDisponible: tieneLimite
          ? Number((montoMaximo - saldo).toFixed(2))
          : null,
      };
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
