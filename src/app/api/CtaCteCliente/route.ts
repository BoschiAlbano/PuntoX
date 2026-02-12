import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import {
  TIPO_COMPROBANTE_VENTA,
  TIPO_PAGO,
} from "@/lib/constants/comprobantes";
import {
  registrarPagoCuentaCorriente,
  formaPagoSchema,
} from "@/lib/services/comprobantes";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { z } from "zod";

export const pagoCtaCteSchema = z.object({
  clienteId: z.number().int().positive(),
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
      permission: PERMISSIONS.CLIENTES,
    });

    const searchParams = req.nextUrl.searchParams;
    const clienteIdStr = searchParams.get("clienteId");

    if (!clienteIdStr) {
      return NextResponse.json(
        { error: "Cliente ID es requerido" },
        { status: 400 },
      );
    }

    const clienteId = BigInt(clienteIdStr);
    const tenantIdBigInt = BigInt(tenantId);

    // 1. Fetch Invoices (Debits) that have a CtaCte payment component
    // We look for Comprobantes that have at least one FormaPago of type CUENTA_CORRIENTE (4)
    // linked to this client.
    const facturas = await prisma.comprobante.findMany({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        FormaPago: {
          some: {
            TipoPago: TIPO_PAGO.CUENTA_CORRIENTE,
            FormaPago_CtaCte: {
              ClienteId: clienteId,
            },
          },
        },
      },
      include: {
        FormaPago: {
          where: {
            TipoPago: TIPO_PAGO.CUENTA_CORRIENTE,
          },
        },
        Movimiento: true, // Include Movimiento to get description
      },
    });

    // 2. Fetch Payments/Credits (Credits)
    // Includes Payment Receipts (Type 7) and Credit Notes (Type 6) if they affect CtaCte?
    // Usually Credit Notes for CtaCte invoices should impact CtaCte.
    // For now, let's focus on Type 7 (Pagos a Cta Cte) which are explicitly payments.
    // Also, usually Nota Credito might offset debt.
    // Let's check if Nota Credito has FormaPago CtaCte?
    // Usually NC reflects a return. If the original sale was CtaCte, the NC might be applied to CtaCte.
    // If it is applied to CtaCte, it should have a negative effect or appear as Credit.
    // But in this system, NC is a separate document.
    // Let's fetch Type 7 first.
    const pagos = await prisma.comprobante.findMany({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        TipoComprobante: TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE,
        Comprobante_CuentaCorriente: {
          ClienteId: clienteId,
        },
      },
      include: {
        Movimiento: true, // Include Movimiento
      },
    });

    // We also need to consider NOTA_CREDITO (6) ?
    // If a NC is issued, it acts as a credit.
    // Does NC have FormaPago? Yes.
    // If NC has FormaPago CtaCte, it means we are crediting the CtaCte.
    // So logic for Factura (Debit) works for NC (Credit) if we assume NC decreases balance.
    // But `facturas` query above includes ANY composed with CtaCte FormaPago.
    // If TipoComprobante is Nota Credito (6), it should be treated as Credit (Haber).

    // Let's map everything to a timeline.
    const movimientos = [];

    // Process "Facturas" (which implies any doc with CtaCte payment form)
    for (const f of facturas) {
      // Sum only CtaCte parts
      const montoCtaCte = f.FormaPago.reduce(
        (sum: number, fp: { Monto: any }) => sum + Number(fp.Monto),
        0,
      );

      const isNotaCredito =
        f.TipoComprobante === TIPO_COMPROBANTE_VENTA.NOTA_CREDITO;

      const descripcion =
        f.Movimiento?.[0]?.Descripcion || `Comp. #${f.Numero}`;

      // If it's a Sale (Factura, Remito...), it's a Debit (Debe).
      // If it's a NC, it's a Credit (Haber).
      if (isNotaCredito) {
        movimientos.push({
          id: Number(f.Id),
          fecha: f.Fecha,
          tipo: "Nota de Crédito",
          detalles: descripcion,
          debe: 0,
          haber: montoCtaCte,
        });
      } else {
        // Factura A, B, C, Presupuesto? Presupuesto usually doesn't generate debt until invoiced.
        // Assuming filters catch valid sales.
        let tipoStr = "Venta";
        if (f.TipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_A)
          tipoStr = "Factura A";
        if (f.TipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_B)
          tipoStr = "Factura B";
        if (f.TipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_C)
          tipoStr = "Factura C";

        movimientos.push({
          id: Number(f.Id),
          fecha: f.Fecha,
          tipo: tipoStr,
          detalles: descripcion,
          debe: montoCtaCte,
          haber: 0,
        });
      }
    }

    // Process Explicit Payments (Type 7) if not already included
    // Type 7 usually has NO FormaPago linked? Or maybe it does?
    // Let's check createCuentaCorrienteCliente.
    // It calls createBaseComprobante. It creates FormaPago... wait?
    // CreateCuentaCorrienteCliente calls createBaseComprobante with formasPago.
    // But `createCuentaCorrienteCliente` logic in backend code shows:
    // It creates `Comprobante_CuentaCorriente`.
    // And inside `createBaseComprobante`, it creates `FormaPago`.
    // The Input to `createCuentaCorrienteCliente` has `formasPago`.
    // These `formasPago` represent HOW the client paid (Cash, Check, etc.).
    // So the "Comprobante" itself represents the Payment to the Account.
    // So the TOTAL of the Comprobante is the verified payment amount.

    // Check if `pagos` overlaps with `facturas`.
    // `facturas` query checks for `FormaPago` with `TipoPago = 4` (CtaCte).
    // A Payment Receipt (Recibo de Cobranza) usually has `FormaPago` = Cash/Card.
    // So it will NOT be in `facturas`. Good.

    for (const p of pagos) {
      const descripcion =
        p.Movimiento?.[0]?.Descripcion || `Comp. #${p.Numero}`;

      movimientos.push({
        id: Number(p.Id),
        fecha: p.Fecha,
        tipo: "Pago",
        detalles: descripcion,
        debe: 0,
        haber: Number(p.Total),
      });
    }

    // Sort by Date
    movimientos.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    // Calculate Running Balance
    let saldo = 0;
    const items = movimientos.map((m) => {
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
      permission: PERMISSIONS.CLIENTES,
    });
    const tenantIdBigInt = BigInt(tenantId);

    // Get User and Service Data
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { AuthUserId: user.id, EstaEliminado: false },
      select: {
        Id: true,
        EmpleadoId: true,
        Sucursales: {
          where: {
            EsDefault: true,
          },
          select: {
            EsDefault: true,
            SucursalId: true,
          },
          take: 1,
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 },
      );
    }

    const sucursalId = usuario.Sucursales[0]?.SucursalId;
    if (!sucursalId) {
      return NextResponse.json(
        { error: "El usuario no tiene una sucursal por defecto asignada" },
        { status: 400 },
      );
    }

    if (!usuario.EmpleadoId) {
      return NextResponse.json(
        {
          error:
            "El usuario no tiene un empleado asociado para registrar pagos.",
        },
        { status: 400 },
      );
    }

    // Find Open Caja
    const caja = await prisma.caja.findFirst({
      where: {
        UsuarioAperturaId: usuario.Id,
        UsuarioCierreId: null,
        EstaEliminado: false,
      },
    });

    if (!caja) {
      return NextResponse.json(
        { error: "No tienes una caja abierta para registrar el pago" },
        { status: 400 },
      );
    }

    // Parse Body
    const body = await req.json();
    const parsed = pagoCtaCteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { clienteId, monto, formasPago } = parsed.data;

    // Validate Total Matches FormasPago
    const totalPago = formasPago.reduce((sum, fp) => sum + fp.monto, 0);
    // Allow small float diff
    if (Math.abs(totalPago - monto) > 0.01) {
      return NextResponse.json(
        {
          error: `El total de formas de pago (${totalPago}) no coincide con el monto (${monto})`,
        },
        { status: 400 },
      );
    }

    // Get Next Number for Receipt (Type 7)
    // We can fetch via API or DB directly. Using fetch ensures logic consistency if API does locking, but DB is safer here inside transaction?
    // The other route uses fetch. I should try to replicate that or do it manually.
    // However, calling own API in Next.js might be tricky if not absolute URL.
    // And I don't want to make an HTTP call inside this function if I can avoid it.
    // The other route does: `fetch(`${req.nextUrl.origin}/api/contadores?tipoComprobante=${data.tipoComprobante}`...`
    // I entered `req.headers.get("cookie")`...
    // I can do the same.

    const tipoComprobante = TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE;

    // Check contador manually or use the API logic?
    // Let's use the DB logic directly to avoid self-request overhead/issues.

    // We need to lock the counter row or update it atomically.
    // DB: model Contador { ... unique([TenantId, SucursalId, TipoComprobante]) }

    const resultado = await prisma.$transaction(async (tx) => {
      // Increment Counter
      // Note: This simple update might have race conditions if not isolated, but Prisma `update` is atomic for the row.
      // We first try to find it.
      const contador = await tx.contador.findUnique({
        where: {
          TenantId_SucursalId_TipoComprobante: {
            TenantId: tenantIdBigInt,
            SucursalId: sucursalId,
            TipoComprobante: tipoComprobante,
          },
        },
      });

      let numero = 1;

      if (contador) {
        const updated = await tx.contador.update({
          where: { Id: contador.Id },
          data: { Valor: { increment: 1 } },
        });
        numero = updated.Valor;
      } else {
        // Create if not exists
        await tx.contador.create({
          data: {
            TenantId: tenantIdBigInt,
            SucursalId: sucursalId,
            TipoComprobante: tipoComprobante,
            Valor: numero,
            EstaEliminado: false,
          },
        });
      }

      // Call Service
      return registrarPagoCuentaCorriente(
        tx,
        tenantIdBigInt,
        usuario.Id,
        usuario.EmpleadoId!,
        sucursalId,
        caja.Id,
        clienteId,
        monto,
        formasPago,
        numero,
      );
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pago registrado exitosamente",
        comprobanteId: Number(resultado.Id),
        numero: resultado.Numero,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
