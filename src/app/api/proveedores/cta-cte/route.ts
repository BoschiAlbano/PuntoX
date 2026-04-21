import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import {
  TIPO_COMPROBANTE_COMPRA,
  TIPO_PAGO,
  TIPO_MOVIMIENTO,
} from "@/lib/constants/comprobantes";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { z } from "zod";
import { getNextNumeroComprobante } from "@/lib/services/contadores";
import { formaPagoSchema } from "@/lib/services/comprobantes";

export const pagoCtaCteProveedorSchema = z.object({
  proveedorId: z.number().int().positive(),
  monto: z
    .number()
    .positive()
    .max(999_999_999_999, "El monto no puede exceder el límite permitido"),
  formasPago: z.array(formaPagoSchema).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PROVEEDORES,
    });

    const searchParams = req.nextUrl.searchParams;
    const proveedorIdStr = searchParams.get("proveedorId");

    if (!proveedorIdStr) {
      return NextResponse.json(
        { error: "Proveedor ID es requerido" },
        { status: 400 },
      );
    }

    const proveedorId = BigInt(proveedorIdStr);
    const tenantIdBigInt = BigInt(tenantId);

    // 1. Obtener compras (Facturas que aumentan la deuda/Haber desde la perspectiva del proveedor)
    const compras = await prisma.comprobante.findMany({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Comprobante_Compra: {
          ProveedorId: proveedorId,
        },
        FormaPago: {
          some: {
            TipoPago: TIPO_PAGO.CUENTA_CORRIENTE,
          },
        },
      },
      include: {
        FormaPago: {
          where: {
            TipoPago: TIPO_PAGO.CUENTA_CORRIENTE,
          },
        },
        Movimiento: true,
      },
    });

    // 2. Obtener Pagos al Proveedor (Tipo: 9, reducen la deuda)
    const pagos = await prisma.comprobante.findMany({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        TipoComprobante: TIPO_COMPROBANTE_COMPRA.CTA_CORRIENTE_PROVEEDOR,
        Comprobante_CtaCteProveedor: {
          ProveedorId: proveedorId,
        },
      },
      include: {
        Movimiento: true,
      },
    });

    const movimientos = [];

    // Por convención: Debe = Pagos efectuados (Reduce deuda) | Haber = Compras realizadas (Aumenta deuda)
    // O al revés: Saldos positivos = Deuda que tenemos con el proveedor.
    for (const c of compras) {
      const montoCtaCte = c.FormaPago.reduce(
        (sum: number, fp: any) => sum + Number(fp.Monto),
        0,
      );

      const descripcion =
        c.Movimiento?.[0]?.Descripcion || `Compra #${c.Numero}`;

      movimientos.push({
        id: Number(c.Id),
        fecha: c.Fecha,
        tipo: "Compra",
        detalles: descripcion,
        debe: montoCtaCte, // Lo que incrementa la deuda (Debe para nosotros, Haber para el proveedor)
        haber: 0,
      });
    }

    for (const p of pagos) {
      const descripcion =
        p.Movimiento?.[0]?.Descripcion || `Pago #${p.Numero}`;

      movimientos.push({
        id: Number(p.Id),
        fecha: p.Fecha,
        tipo: "Pago",
        detalles: descripcion,
        debe: 0,
        haber: Number(p.Total), // Lo que reduce la deuda
      });
    }

    // Ordenar cronológicamente
    movimientos.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    let saldo = 0;
    const items = movimientos.map((m) => {
      // Saldo positivo indica cuánta plata le debemos al proveedor
      saldo += m.debe - m.haber;
      return {
        ...m,
        saldo: parseFloat(saldo.toFixed(2)),
      };
    });

    return NextResponse.json({ items, saldoTotal: saldo }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.PROVEEDORES,
    });
    const tenantIdBigInt = BigInt(tenantId);

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const usuario = await prisma.usuario.findFirst({
      where: { AuthUserId: user.id, EstaEliminado: false },
      select: {
        Id: true,
        EmpleadoId: true,
        Sucursales: {
          where: { EsDefault: true },
          select: { SucursalId: true },
          take: 1,
        },
      },
    });

    if (!usuario || !usuario.EmpleadoId) {
      return NextResponse.json(
        { error: "Usuario o empleado no encontrado" },
        { status: 400 },
      );
    }

    const sucursalId = usuario.Sucursales[0]?.SucursalId;
    if (!sucursalId) {
      return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 400 });
    }

    const caja = await prisma.caja.findFirst({
      where: {
        UsuarioAperturaId: usuario.Id,
        UsuarioCierreId: null,
        EstaEliminado: false,
      },
    });

    if (!caja) return NextResponse.json({ error: "Caja cerrada" }, { status: 400 });

    const body = await req.json();
    const parsed = pagoCtaCteProveedorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { proveedorId, monto, formasPago } = parsed.data;
    const totalPago = formasPago.reduce((sum, fp) => sum + fp.monto, 0);

    if (Math.abs(totalPago - monto) > 0.01) {
      return NextResponse.json({ error: "Los pagos no cuadran" }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const fecha = new Date();
      
      const numero = await getNextNumeroComprobante(
        tenantIdBigInt,
        TIPO_COMPROBANTE_COMPRA.CTA_CORRIENTE_PROVEEDOR,
        null,
        tx,
      );

      const comprobante = await tx.comprobante.create({
        data: {
          TenantId: tenantIdBigInt,
          UsuarioId: usuario.Id,
          EmpleadoId: usuario.EmpleadoId,
          SucursalId: sucursalId,
          Fecha: fecha,
          Numero: numero,
          SubTotal: monto,
          Descuento: 0,
          Total: monto,
          Iva21: 0,
          Iva105: 0,
          TipoComprobante: TIPO_COMPROBANTE_COMPRA.CTA_CORRIENTE_PROVEEDOR,
          EstaEliminado: false,
        },
      });

      // 2. Asociar el comprobante a Cta Cte Proveedor
      await tx.comprobante_CtaCteProveedor.create({
        data: {
          Id: comprobante.Id,
          ProveedorId: BigInt(proveedorId),
          Estado: 1, // Ej: Registrado
        },
      });

      // 3. Crear formas de pago y descontar caja
      for (const fp of formasPago) {
        if (!fp.monto) continue;

        await tx.formaPago.create({
          data: {
            TenantId: tenantIdBigInt,
            ComprobanteId: comprobante.Id,
            TipoPago: fp.tipoPago,
            Monto: fp.monto,
            EstaEliminado: false,
          },
        });

        // Actualizar salidas en caja
        let fieldToUpdate: string | undefined;
        switch (fp.tipoPago) {
          case TIPO_PAGO.EFECTIVO: fieldToUpdate = "TotalSalidaEfectivo"; break;
          case TIPO_PAGO.TARJETA: fieldToUpdate = "TotalSalidaTarjeta"; break;
          case TIPO_PAGO.CHEQUE: fieldToUpdate = "TotalSalidaCheque"; break;
          case TIPO_PAGO.TRANSFERENCIA: fieldToUpdate = "TotalSalidaTransf"; break;
          // No deberíamos pagar con Cta Cte una deuda de Cta Cte, pero por las dudas
          case TIPO_PAGO.CUENTA_CORRIENTE: fieldToUpdate = "TotalSalidaCtaCte"; break;
        }

        if (fieldToUpdate) {
          await tx.caja.update({
            where: { Id: caja.Id },
            data: {
              [fieldToUpdate]: { increment: fp.monto },
            },
          });
        }

        // 4. Detalle de Caja (Registro negativo por ser Salida)
        const detalleParams = {
          CajaId: caja.Id,
          TipoPago: fp.tipoPago,
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
        };

        const existingDetalle = await tx.detalleCaja.findFirst({
          where: detalleParams,
        });

        if (existingDetalle) {
          await tx.detalleCaja.update({
            where: { Id: existingDetalle.Id },
            data: { Monto: { decrement: fp.monto } }, // Decrement as it is an outflow
          });
        } else {
          await tx.detalleCaja.create({
            data: {
              ...detalleParams,
              Monto: -fp.monto,
            },
          });
        }
      }

      // 5. Movimiento de Salida (Egreso de Dinero a Favor del Prov)
      const movimiento = await tx.movimiento.create({
        data: {
          CajaId: caja.Id,
          TenantId: tenantIdBigInt,
          UsuarioId: usuario.Id,
          ComprobanteId: comprobante.Id,
          Monto: monto,
          Fecha: fecha,
          Descripcion: `Pago Cta Cte Proveedor - Comp #${numero}`,
          TipoMovimiento: TIPO_MOVIMIENTO.SALIDA,
          EstaEliminado: false,
        },
      });

      // 6. Vinculación exclusiva a Movimiento Cta Cte Proveedor
      await tx.movimiento_CuentaCorrienteProveedor.create({
        data: {
          Id: movimiento.Id,
          ProveedorId: BigInt(proveedorId),
        },
      });

      return comprobante;
    });

    return NextResponse.json(
      {
        success: true,
        comprobanteId: Number(resultado.Id),
        numero: resultado.Numero,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
