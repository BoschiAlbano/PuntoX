import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma"; // Assuming this is the correct path for prisma client
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { handleError } from "@/lib/errors/handler";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";
import {
  createComprobanteBaseSchema,
  createFacturaA,
  createFacturaB,
  createFacturaC,
  createPresupuesto,
  createRemito,
  createNotaCredito,
  createCuentaCorrienteCliente,
  ensureConsumerFinal,
} from "@/lib/services/comprobantes";
import { getNextNumeroComprobante } from "@/lib/services/contadores";

// POST: Crear comprobante (venta)
export async function POST(req: NextRequest) {
  try {
    const { tenantId, error: authError } = await getAuthUser();

    if (authError) {
      return authError;
    }

    // Obtener usuario y empleado actual
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

    const body = await req.json();
    const parsed = createComprobanteBaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const tenantIdBigInt = BigInt(tenantId);
    const usuarioId = usuario.Id;
    const empleadoId = usuario.EmpleadoId;
    const sucursalId = usuario.Sucursales[0].SucursalId;

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Error, Sucursal no encontrada" },
        { status: 401 },
      );
    }

    // Si clienteId es null o undefined, usar 0 para Consumidor Final
    if (data.clienteId === null || data.clienteId === undefined) {
      data.clienteId = 0;
    }

    // Prepare client ID (will be resolved in transaction if 0)
    let clienteIdFinal = data.clienteId || 0;

    // Validar artículos y stock
    const articulosIds = data.detalles.map((d) => BigInt(d.articuloId));

    const [articulos, configuracion] = await Promise.all([
      prisma.articulo.findMany({
        where: {
          Id: { in: articulosIds },
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
        },
        include: {
          Iva: true,
          ArticuloStock: {
            where: {
              SucursalId: sucursalId,
            },
          },
        },
      }),
      prisma.configuracion.findFirst({
        where: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
        },
      }),
    ]);

    if (articulos.length !== data.detalles.length) {
      return NextResponse.json(
        { error: "Uno o más productos no fueron encontrados" },
        { status: 404 },
      );
    }

    // Validar stock si corresponde
    for (const detalle of data.detalles) {
      const articulo = articulos.find(
        (a) => Number(a.Id) === detalle.articuloId,
      );
      if (!articulo) continue;

      if (articulo.DescuentaStock) {
        const stockActual = articulo.ArticuloStock[0]?.Stock
          ? Number(articulo.ArticuloStock[0].Stock)
          : 0;

        if (stockActual < detalle.cantidad && !articulo.PermiteStockNegativo) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para ${articulo.Descripcion}. Stock disponible: ${stockActual}`,
            },
            { status: 400 },
          );
        }
      }
    }

    const descuentaStock =
      (data.tipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_A &&
        configuracion?.FacturaDescuentaStock) ||
      (data.tipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_B &&
        configuracion?.PresupuestoDescuentaStock) ||
      (data.tipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_C &&
        configuracion?.RemitoDescuentaStock) ||
      (data.tipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_A &&
        configuracion?.FacturaDescuentaStock) ||
      (data.tipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_B &&
        configuracion?.FacturaDescuentaStock) ||
      (data.tipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_C &&
        configuracion?.FacturaDescuentaStock) ||
      (data.tipoComprobante === TIPO_COMPROBANTE_VENTA.PRESUPUESTO &&
        configuracion?.PresupuestoDescuentaStock) ||
      (data.tipoComprobante === TIPO_COMPROBANTE_VENTA.REMITO &&
        configuracion?.RemitoDescuentaStock) ||
      (data.tipoComprobante === TIPO_COMPROBANTE_VENTA.NOTA_CREDITO &&
        configuracion?.FacturaDescuentaStock) ||
      false;

    // Calcular totales
    const subtotal = data.detalles.reduce((sum, d) => sum + d.subtotal, 0);
    const descuento = data.descuento || 0;
    const subtotalConDescuento = subtotal - descuento;

    // Calcular IVA
    let iva21 = 0;
    let iva105 = 0;

    for (const detalle of data.detalles) {
      const articulo = articulos.find(
        (a) => Number(a.Id) === detalle.articuloId,
      );
      if (!articulo) continue;

      const porcentajeIva = Number(articulo.Iva.Porcentaje);
      const baseImponible = detalle.subtotal * (1 - descuento / subtotal);

      detalle.iva = porcentajeIva;

      if (porcentajeIva === 21) {
        iva21 += (baseImponible * 21) / 121;
        // detalle.iva = (baseImponible * 21) / 121;
      } else if (porcentajeIva === 10.5) {
        iva105 += (baseImponible * 10.5) / 110.5;
        // detalle.iva = (baseImponible * 10.5) / 110.5;
      }
    }

    const total = subtotalConDescuento;

    // Validar formas de pago
    const totalFormasPago = data.formasPago.reduce(
      (sum, fp) => sum + fp.monto,
      0,
    );

    if (Math.abs(totalFormasPago - total) > 0.01) {
      return NextResponse.json(
        {
          error: `El total de formas de pago (${totalFormasPago}) no coincide con el total de la venta (${total})`,
        },
        { status: 400 },
      );
    }

    // Find Open Caja
    const caja = await prisma.caja.findFirst({
      where: {
        UsuarioAperturaId: usuarioId,
        UsuarioCierreId: null,
        EstaEliminado: false,
      },
    });

    if (!caja) {
      return NextResponse.json(
        { error: "No tienes una caja abierta" },
        { status: 400 },
      );
    }

    const cajaId = caja.Id;

    if (
      data.tipoComprobante ===
        TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE &&
      !cajaId
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes una caja abierta para realizar cobros en cuenta corriente.",
        },
        { status: 400 },
      );
    }

    // Transaction
    const resultado = await prisma.$transaction(async (tx) => {
      // 0. Resolver cliente
      let cliente = null;
      if (clienteIdFinal == 0) {
        clienteIdFinal = await ensureConsumerFinal(tx, tenantIdBigInt);
      } else {
        // verificar si existe el cliente
        cliente = await tx.persona.findUnique({
          where: { Id: clienteIdFinal },
        });
        if (!cliente) {
          throw new Error("Cliente no encontrado");
        }
      }

      switch (data.tipoComprobante) {
        case TIPO_COMPROBANTE_VENTA.FACTURA_A:
          // Obtener próximo número dentro de la transacción
          const numeroA = await getNextNumeroComprobante(
            tenantIdBigInt,
            data.tipoComprobante,
            null,
            tx,
          );
          return createFacturaA(
            tx,
            data,
            tenantIdBigInt,
            usuarioId,
            empleadoId,
            numeroA,
            clienteIdFinal,
            iva21,
            iva105,
            !!descuentaStock,
            sucursalId,
            cajaId,
          );
        case TIPO_COMPROBANTE_VENTA.FACTURA_B:
          const numeroB = await getNextNumeroComprobante(
            tenantIdBigInt,
            data.tipoComprobante,
            null,
            tx,
          );
          return createFacturaB(
            tx,
            data,
            tenantIdBigInt,
            usuarioId,
            empleadoId,
            numeroB,
            clienteIdFinal,
            iva21,
            iva105,
            !!descuentaStock,
            sucursalId,
            cajaId,
          );
        case TIPO_COMPROBANTE_VENTA.FACTURA_C:
          const numeroC = await getNextNumeroComprobante(
            tenantIdBigInt,
            data.tipoComprobante,
            null,
            tx,
          );
          return createFacturaC(
            tx,
            data,
            tenantIdBigInt,
            usuarioId,
            empleadoId,
            numeroC,
            clienteIdFinal,
            !!descuentaStock,
            sucursalId,
            cajaId,
          );
        case TIPO_COMPROBANTE_VENTA.PRESUPUESTO:
          const numeroP = await getNextNumeroComprobante(
            tenantIdBigInt,
            data.tipoComprobante,
            null,
            tx,
          );
          return createPresupuesto(
            tx,
            data,
            tenantIdBigInt,
            usuarioId,
            empleadoId,
            numeroP,
            clienteIdFinal,
            !!descuentaStock,
            sucursalId,
          );
        case TIPO_COMPROBANTE_VENTA.REMITO:
          const numeroR = await getNextNumeroComprobante(
            tenantIdBigInt,
            data.tipoComprobante,
            null,
            tx,
          );
          return createRemito(
            tx,
            data,
            tenantIdBigInt,
            usuarioId,
            empleadoId,
            numeroR,
            clienteIdFinal,
            !!descuentaStock,
            sucursalId,
          );
        case TIPO_COMPROBANTE_VENTA.NOTA_CREDITO:
          const numeroNC = await getNextNumeroComprobante(
            tenantIdBigInt,
            data.tipoComprobante,
            null,
            tx,
          );
          return createNotaCredito(
            tx,
            data,
            tenantIdBigInt,
            usuarioId,
            empleadoId,
            numeroNC,
            clienteIdFinal,
            iva21,
            iva105,
            !!descuentaStock,
            sucursalId,
            cajaId,
          );
        case TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE:
          if (!cliente) {
            throw new Error("Cliente no encontrado");
          }
          // Nota: Cuenta Corriente Cliente usa comprobante pero ¿usa numeración?
          // Revisando createCuentaCorrienteCliente... sí, usa numero.
          const numeroCC = await getNextNumeroComprobante(
            tenantIdBigInt,
            data.tipoComprobante,
            null,
            tx,
          );
          return createCuentaCorrienteCliente(
            tx,
            data,
            tenantIdBigInt,
            usuarioId,
            empleadoId,
            numeroCC,
            clienteIdFinal,
            sucursalId,
            cajaId!,
          );
        default:
          throw new Error("Tipo de comprobante no soportado");
      }
    });

    return NextResponse.json(
      {
        comprobante: {
          id: Number(resultado.Id),
          numero: resultado.Numero,
          tipoComprobante: resultado.TipoComprobante,
          total: Number(resultado.Total),
          fecha: resultado.Fecha.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { tenantId, error: authError } = await getAuthUser();
    if (authError) return authError;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const detalle = url.searchParams.get("detalle") === "true";

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const tenantIdBigInt = BigInt(tenantId);

    // Fetch comprobante with all related data
    const comprobante = await prisma.comprobante.findUnique({
      where: {
        Id: BigInt(id),
        TenantId: tenantIdBigInt,
      },
      include: {
        // Include common relations if detalle is true
        ...(detalle && {
          DetalleComprobante: true,
          FormaPago: true,
          Comprobante_Factura: {
            include: {
              Persona_Cliente: { include: { Persona: true } },
            },
          },
          Comprobante_CuentaCorriente: {
            include: {
              Persona_Cliente: { include: { Persona: true } },
            },
          },
          // Add other relations as needed e.g. Comprobante_NotaCredito
        }),
      },
    });

    if (!comprobante) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 },
      );
    }

    // Resolve Cliente for convenience
    let cliente = null;
    if (comprobante.Comprobante_Factura) {
      cliente = (comprobante.Comprobante_Factura as any).Persona_Cliente
        .Persona;
    } else if (comprobante.Comprobante_CuentaCorriente) {
      cliente = (comprobante.Comprobante_CuentaCorriente as any).Persona_Cliente
        .Persona;
    }

    return new NextResponse(JSON.stringify({ ...comprobante, cliente }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
}
