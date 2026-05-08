import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import {
  ESTADO_FACTURA,
  TIPO_COMPROBANTE_VENTA,
  GET_PERMISSIONS,
} from "@/lib/constants/comprobantes";

const TIPOS_FACTURA = [
  TIPO_COMPROBANTE_VENTA.FACTURA_A,
  TIPO_COMPROBANTE_VENTA.FACTURA_B,
  TIPO_COMPROBANTE_VENTA.FACTURA_C,
];

// GET /api/cobros
// ?count=true  → retorna solo { count: number }
// Paginado FIFO (orderBy Fecha asc) con comprobantes Factura A/B/C en estado PENDIENTE
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.CAJA,
    });

    const searchParams = req.nextUrl.searchParams;
    const soloCount = searchParams.get("count") === "true";

    const where = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
      TipoComprobante: { in: TIPOS_FACTURA },
      Comprobante_Factura: {
        Estado: ESTADO_FACTURA.PENDIENTE,
      },
    };

    if (soloCount) {
      const count = await prisma.comprobante.count({ where });
      return NextResponse.json({ count });
    }

    const pagination = parsePaginationParams(req);
    const total = await prisma.comprobante.count({ where });

    const comprobantes = await prisma.comprobante.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { Fecha: "asc" }, // FIFO
      include: {
        Comprobante_Factura: {
          include: {
            Persona_Cliente: {
              include: {
                Persona: {
                  select: {
                    Id: true,
                    Nombre: true,
                    Apellido: true,
                    Dni: true,
                  },
                },
              },
            },
          },
        },
        DetalleComprobante: {
          where: { EstaEliminado: false },
          select: {
            Id: true,
            Descripcion: true,
            Cantidad: true,
            Precio: true,
            SubTotal: true,
            Iva: true,
            ArticuloId: true,
            Codigo: true,
            Costo: true,
          },
        },
      },
    });

    const data = comprobantes.map((c) => {
      const factura = c.Comprobante_Factura;
      const persona = factura?.Persona_Cliente?.Persona;
      return {
        id: Number(c.Id),
        numero: Number(c.Numero),
        tipoComprobante: Number(c.TipoComprobante),
        fecha: c.Fecha,
        subtotal: Number(c.SubTotal),
        descuento: Number(c.Descuento),
        total: Number(c.Total),
        estado: factura?.Estado ?? null,
        clienteId: factura ? Number(factura.Id) : null,
        cliente: persona
          ? {
              id: Number(persona.Id),
              nombre: persona.Nombre,
              apellido: persona.Apellido,
              dni: persona.Dni,
            }
          : null,
        activarCtaCte: factura?.Persona_Cliente?.ActivarCtaCte ?? false,
        detalles: c.DetalleComprobante.map((d) => ({
          id: Number(d.Id),
          articuloId: Number(d.ArticuloId),
          codigo: d.Codigo,
          descripcion: d.Descripcion,
          cantidad: Number(d.Cantidad),
          precio: Number(d.Precio),
          iva: Number(d.Iva),
          subtotal: Number(d.SubTotal),
          costo: Number(d.Costo),
        })),
      };
    });

    const response = createPaginationResponse(data, total, pagination);
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
