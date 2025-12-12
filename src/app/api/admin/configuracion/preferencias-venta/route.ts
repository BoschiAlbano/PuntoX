import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

const savePreferenciasSchema = z.object({
  imprimir: z.boolean(),
  unificarRenglonesProducto: z.boolean(),
  tipoFormaPagoDefault: z
    .number()
    .int()
    .min(0, "Forma de pago inválida")
    .max(3, "Forma de pago inválida"), // 0: Efectivo, 1: Débito, 2: Crédito, 3: QR
  facturaDescuentaStock: z.boolean(),
  presupuestoDescuentaStock: z.boolean(),
  remitoDescuentaStock: z.boolean(),
  ingresoManualCajaInicial: z.boolean(),
  puestoCajaSeparado: z.boolean(),
  activarRetiroDeCaja: z.boolean(),
  montoMaximoRetiroCaja: z
    .number()
    .min(0, "El monto máximo de retiro debe ser mayor o igual a 0"),
  activarBascula: z.boolean(),
  etiquetaPorPeso: z.boolean(),
  codigoBascula: z.string().nullable(),
  mostrarPreciosConIva: z.boolean(),
  abrirCajonEfectivo: z.boolean(),
  numerarPedidosPantalla: z.boolean(),
});

async function resolveTenantId() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenantId = user?.user_metadata?.tenantId;
  return tenantId ? Number(tenantId) : null;
}

export async function GET() {
  const tenantId = await resolveTenantId();
  if (!tenantId) {
    return NextResponse.json(
      { error: "No autenticado", code: "TENANT_MISSING" },
      { status: 401 }
    );
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
      return NextResponse.json(
        {
          existsConfiguracion: false,
          error: "No existe configuración. Completa primero el Perfil del negocio.",
          code: "CONFIG_MISSING",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en GET /api/admin/configuracion/preferencias-venta:", error);

    const isConnectionError =
      error?.code === "P1001" ||
      error?.code === "P1002" ||
      error?.code === "P1003" ||
      error?.message?.toLowerCase().includes("can't reach database server") ||
      error?.message?.toLowerCase().includes("connection timeout") ||
      error?.message?.toLowerCase().includes("connection refused") ||
      error?.message?.toLowerCase().includes("econnrefused") ||
      error?.message?.toLowerCase().includes("etimedout");

    if (isConnectionError) {
      return NextResponse.json(
        {
          error: "Error de conexión a la base de datos. Verifica tu conexión.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Error al cargar las preferencias de venta" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const tenantId = await resolveTenantId();
  if (!tenantId) {
    return NextResponse.json(
      { error: "No autenticado", code: "TENANT_MISSING" },
      { status: 401 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = savePreferenciasSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;

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
      return NextResponse.json(
        {
          error: "No existe configuración. Completa primero el Perfil del negocio.",
          code: "CONFIG_MISSING",
        },
        { status: 404 }
      );
    }

    // Actualizar solo los campos de venta/caja/stock
    await prisma.configuracion.update({
      where: { Id: configuracionVigente.Id },
      data: {
        Imprimir: data.imprimir,
        UnificarRenglonesIngresarMismoProducto: data.unificarRenglonesProducto,
        TipoFormaPagoPorDefectoVenta: data.tipoFormaPagoDefault,
        FacturaDescuentaStock: data.facturaDescuentaStock,
        PresupuestoDescuentaStock: data.presupuestoDescuentaStock,
        RemitoDescuentaStock: data.remitoDescuentaStock,
        IngresoManualCajaInicial: data.ingresoManualCajaInicial,
        PuestoCajaSeparado: data.puestoCajaSeparado,
        ActivarRetiroDeCaja: data.activarRetiroDeCaja,
        MontoMaximoRetiroCaja: data.montoMaximoRetiroCaja,
        ActivarBascula: data.activarBascula,
        EtiquetaPorPeso: data.etiquetaPorPeso,
        CodigoBascula: data.codigoBascula,
        MostrarPreciosConIva: data.mostrarPreciosConIva,
        AbrirCajonEfectivo: data.abrirCajonEfectivo,
        NumerarPedidosPantalla: data.numerarPedidosPantalla,
      },
    });

    // Retornar datos actualizados
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

    return NextResponse.json(
      {
        existsConfiguracion: true,
        imprimir: configuracion!.Imprimir,
        unificarRenglonesProducto: configuracion!.UnificarRenglonesIngresarMismoProducto,
        tipoFormaPagoDefault: Number(configuracion!.TipoFormaPagoPorDefectoVenta),
        facturaDescuentaStock: configuracion!.FacturaDescuentaStock,
        presupuestoDescuentaStock: configuracion!.PresupuestoDescuentaStock,
        remitoDescuentaStock: configuracion!.RemitoDescuentaStock,
        ingresoManualCajaInicial: configuracion!.IngresoManualCajaInicial,
        puestoCajaSeparado: configuracion!.PuestoCajaSeparado,
        activarRetiroDeCaja: configuracion!.ActivarRetiroDeCaja,
        montoMaximoRetiroCaja: Number(configuracion!.MontoMaximoRetiroCaja),
        activarBascula: configuracion!.ActivarBascula,
        etiquetaPorPeso: configuracion!.EtiquetaPorPeso,
        codigoBascula: configuracion!.CodigoBascula,
        mostrarPreciosConIva: configuracion!.MostrarPreciosConIva ?? true,
        abrirCajonEfectivo: configuracion!.AbrirCajonEfectivo ?? true,
        numerarPedidosPantalla: configuracion!.NumerarPedidosPantalla ?? true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en PUT /api/admin/configuracion/preferencias-venta:", error);

    const isConnectionError =
      error?.code === "P1001" ||
      error?.code === "P1002" ||
      error?.code === "P1003" ||
      error?.message?.toLowerCase().includes("can't reach database server") ||
      error?.message?.toLowerCase().includes("connection timeout") ||
      error?.message?.toLowerCase().includes("connection refused") ||
      error?.message?.toLowerCase().includes("econnrefused") ||
      error?.message?.toLowerCase().includes("etimedout");

    if (isConnectionError) {
      return NextResponse.json(
        {
          error: "Error de conexión a la base de datos. Verifica tu conexión.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "No se pudieron guardar las preferencias de venta" },
      { status: 500 }
    );
  }
}

