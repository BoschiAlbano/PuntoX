import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { handleError } from "@/lib/errors/handler";

const payloadSchema = z.object({
  razonSocial: z.string().min(1, "Razon social requerida"),
  nombreFantasia: z.string().optional().nullable(),
  cuit: z.string().min(1, "CUIT requerido"),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  celular: z.string().optional().nullable(),
  direccion: z.string().min(1, "Dirección requerida"),
  localidadId: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") {
        return null;
      }
      const num = typeof val === "string" ? Number(val) : (typeof val === "number" ? val : null);
      if (num === null || Number.isNaN(num) || num <= 0) {
        return null;
      }
      return num;
    },
    z.union([
      z.number().int().positive("Debe seleccionar una localidad válida"),
      z.null()
    ])
  ).refine((val) => val !== null && val > 0, {
    message: "Debe seleccionar una localidad"
  }),
  observacionPieFactura: z.string().optional().nullable(),
  // Preferencias de venta básicas
  mostrarPreciosConIva: z.boolean().optional(),
  abrirCajonEfectivo: z.boolean().optional(),
  numerarPedidosPantalla: z.boolean().optional(),
  imprimir: z.boolean().optional(),
  // Stock y compras
  facturaDescuentaStock: z.boolean().optional(),
  presupuestoDescuentaStock: z.boolean().optional(),
  remitoDescuentaStock: z.boolean().optional(),
  actualizaCostoDesdeCompra: z.boolean().optional(),
  modificaPrecioVentaDesdeCompra: z.boolean().optional(),
  // Caja y pagos
  tipoFormaPagoPorDefectoVenta: z.number().int().min(0).max(3).optional(),
  tipoFormaPagoPorDefectoCompra: z.number().int().min(0).max(3).optional(),
  ingresoManualCajaInicial: z.boolean().optional(),
  puestoCajaSeparado: z.boolean().optional(),
  activarRetiroDeCaja: z.boolean().optional(),
  montoMaximoRetiroCaja: z.number().min(0).optional(),
  // Productos
  unificarRenglonesIngresarMismoProducto: z.boolean().optional(),
  // Báscula
  activarBascula: z.boolean().optional(),
  etiquetaPorPeso: z.boolean().optional(),
  codigoBascula: z.string().optional().nullable(),
});

async function resolveTenantId() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[resolveTenantId] Error al obtener usuario:", authError.message);
      return null;
    }

    if (!user) {
      console.error("[resolveTenantId] Usuario no encontrado");
      return null;
    }

    console.log("[resolveTenantId] Usuario encontrado:", user.id);
    console.log("[resolveTenantId] app_metadata:", JSON.stringify(user.app_metadata, null, 2));

    // Buscar tenantId en diferentes lugares del metadata
    const metadata = user.app_metadata || {};
    const tenantId = 
      metadata.tenantId || 
      metadata.tenant_id || 
      (user as any).tenantId;

    if (tenantId) {
      console.log("[resolveTenantId] tenantId encontrado en metadata:", tenantId);
      return Number(tenantId);
    }

    console.log("[resolveTenantId] tenantId no encontrado en metadata, buscando en DB...");

    // Si no está en metadata, buscar en la base de datos
    try {
      const usuario = await prisma.usuario.findFirst({
        where: { AuthUserId: user.id, EstaEliminado: false },
        select: { TenantId: true },
      });

      if (usuario?.TenantId) {
        console.log("[resolveTenantId] tenantId encontrado en DB:", usuario.TenantId);
        return Number(usuario.TenantId);
      }

      console.error("[resolveTenantId] Usuario no encontrado en DB o sin TenantId");
    } catch (error) {
      console.error("[resolveTenantId] Error buscando tenantId en DB:", error);
    }

    console.error("[resolveTenantId] No se pudo determinar el tenantId");
    return null;
  } catch (error) {
    console.error("[resolveTenantId] Error inesperado:", error);
    return null;
  }
}

export async function GET() {
  const tenantId = await resolveTenantId();
  if (!tenantId) {
    console.error("[GET /api/configuracion] No se pudo determinar el tenantId");
    return NextResponse.json(
      { error: "No se pudo determinar el tenant. Por favor, cierra sesión y vuelve a iniciar sesión." },
      { status: 401 }
    );
  }

  try {
    const config = await prisma.configuracion.findFirst({
      where: { 
        TenantId: tenantId,
        EstaEliminado: false,
      },
      select: {
        Id: true,
        RazonSocial: true,
        NombreFantasia: true,
        Cuit: true,
        Email: true,
        Telefono: true,
        Celular: true,
        Direccion: true,
        LocalidadId: true,
        Localidad: {
          select: {
            Id: true,
            Descripcion: true,
            DepartamentoId: true,
            Departamento: {
              select: {
                Id: true,
                Descripcion: true,
                ProvinciaId: true,
                Provincia: {
                  select: {
                    Id: true,
                    Descripcion: true,
                  },
                },
              },
            },
          },
        },
        ObservacionEnPieFactura: true,
        MostrarPreciosConIva: true,
        AbrirCajonEfectivo: true,
        NumerarPedidosPantalla: true,
        Imprimir: true,
        FacturaDescuentaStock: true,
        PresupuestoDescuentaStock: true,
        RemitoDescuentaStock: true,
        ActualizaCostoDesdeCompra: true,
        ModificaPrecioVentaDesdeCompra: true,
        TipoFormaPagoPorDefectoVenta: true,
        TipoFormaPagoPorDefectoCompra: true,
        IngresoManualCajaInicial: true,
        PuestoCajaSeparado: true,
        ActivarRetiroDeCaja: true,
        MontoMaximoRetiroCaja: true,
        UnificarRenglonesIngresarMismoProducto: true,
        ActivarBascula: true,
        EtiquetaPorPeso: true,
        CodigoBascula: true,
        // Notificaciones - comentado temporalmente hasta regenerar Prisma
        // NotificacionesPush: true,
        // NotificacionesResumenDiario: true,
        // NotificacionesStockBajo: true,
      },
      orderBy: {
        Id: 'desc',
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuracion no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        configuracion: {
          id: Number(config.Id),
          razonSocial: config.RazonSocial ?? "",
          nombreFantasia: config.NombreFantasia ?? "",
          cuit: config.Cuit ?? "",
          email: config.Email ?? "",
          telefono: config.Telefono ?? "",
          celular: config.Celular ?? "",
          direccion: config.Direccion ?? "",
          localidadId: config.LocalidadId ? Number(config.LocalidadId) : null,
          departamentoId: config.Localidad?.DepartamentoId ? Number(config.Localidad.DepartamentoId) : null,
          provinciaId: config.Localidad?.Departamento?.ProvinciaId ? Number(config.Localidad.Departamento.ProvinciaId) : null,
          observacionPieFactura: config.ObservacionEnPieFactura ?? "",
          mostrarPreciosConIva: config.MostrarPreciosConIva ?? true,
          abrirCajonEfectivo: config.AbrirCajonEfectivo ?? true,
          numerarPedidosPantalla: config.NumerarPedidosPantalla ?? true,
          imprimir: config.Imprimir ?? false,
          facturaDescuentaStock: config.FacturaDescuentaStock,
          presupuestoDescuentaStock: config.PresupuestoDescuentaStock,
          remitoDescuentaStock: config.RemitoDescuentaStock,
          actualizaCostoDesdeCompra: config.ActualizaCostoDesdeCompra,
          modificaPrecioVentaDesdeCompra: config.ModificaPrecioVentaDesdeCompra,
          tipoFormaPagoPorDefectoVenta: config.TipoFormaPagoPorDefectoVenta ?? 0,
          tipoFormaPagoPorDefectoCompra: config.TipoFormaPagoPorDefectoCompra ?? 0,
          ingresoManualCajaInicial: config.IngresoManualCajaInicial ?? false,
          puestoCajaSeparado: config.PuestoCajaSeparado ?? false,
          activarRetiroDeCaja: config.ActivarRetiroDeCaja ?? false,
          montoMaximoRetiroCaja: Number(config.MontoMaximoRetiroCaja) ?? 0,
          unificarRenglonesIngresarMismoProducto: config.UnificarRenglonesIngresarMismoProducto ?? true,
          activarBascula: config.ActivarBascula ?? false,
          etiquetaPorPeso: config.EtiquetaPorPeso ?? false,
          codigoBascula: config.CodigoBascula ?? "",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId) {
    console.error("[PUT /api/configuracion] No se pudo determinar el tenantId");
    return NextResponse.json(
      { error: "No se pudo determinar el tenant. Por favor, cierra sesión y vuelve a iniciar sesión." },
      { status: 401 }
    );
  }

  const json = await req.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }

  console.log("Datos recibidos en PUT /api/configuracion:", JSON.stringify(json, null, 2));
  console.log("localidadId recibido:", json.localidadId, "tipo:", typeof json.localidadId);

  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    const errorIssues = parsed.error.issues || [];
    console.error("Error de validación en configuración:", JSON.stringify(errorIssues, null, 2));
    const firstError = errorIssues[0];
    const errorMessage = firstError 
      ? `${firstError.path.join(".")}: ${firstError.message}`
      : "Datos invalidos";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const config = await prisma.configuracion.findFirst({
      where: { 
        TenantId: tenantId,
        EstaEliminado: false,
      },
      select: { Id: true },
      orderBy: {
        Id: 'desc',
      },
    });

    // Usar transacción para asegurar atomicidad
    const result = await prisma.$transaction(async (tx) => {
      // Si no existe configuración, crear una nueva
      if (!config) {
        const newConfig = await tx.configuracion.create({
          data: {
            TenantId: BigInt(tenantId),
            RazonSocial: data.razonSocial,
            NombreFantasia: data.nombreFantasia ?? null,
            Cuit: data.cuit,
            Email: data.email ?? null,
            Telefono: data.telefono ?? null,
            Celular: data.celular ?? null,
            Direccion: data.direccion,
            LocalidadId: data.localidadId ? BigInt(data.localidadId) : null,
            ObservacionEnPieFactura: data.observacionPieFactura ?? null,
            FacturaDescuentaStock: data.facturaDescuentaStock ?? true,
            PresupuestoDescuentaStock: data.presupuestoDescuentaStock ?? false,
            RemitoDescuentaStock: data.remitoDescuentaStock ?? true,
            ActualizaCostoDesdeCompra: data.actualizaCostoDesdeCompra ?? true,
            ModificaPrecioVentaDesdeCompra: data.modificaPrecioVentaDesdeCompra ?? false,
            Imprimir: data.imprimir ?? false,
            Instalada: 1,
            TipoFormaPagoPorDefectoVenta: data.tipoFormaPagoPorDefectoVenta ?? 0,
            TipoFormaPagoPorDefectoCompra: data.tipoFormaPagoPorDefectoCompra ?? 0,
            UnificarRenglonesIngresarMismoProducto: data.unificarRenglonesIngresarMismoProducto ?? true,
            IngresoManualCajaInicial: data.ingresoManualCajaInicial ?? false,
            PuestoCajaSeparado: data.puestoCajaSeparado ?? false,
            ActivarRetiroDeCaja: data.activarRetiroDeCaja ?? false,
            MontoMaximoRetiroCaja: data.montoMaximoRetiroCaja ?? 0,
            ActivarBascula: data.activarBascula ?? false,
            EtiquetaPorPeso: data.etiquetaPorPeso ?? false,
            CodigoBascula: data.codigoBascula ?? null,
            EstaEliminado: false,
            ShowFoto: false,
            MostrarPreciosConIva: data.mostrarPreciosConIva ?? true,
            AbrirCajonEfectivo: data.abrirCajonEfectivo ?? true,
            NumerarPedidosPantalla: data.numerarPedidosPantalla ?? true,
          },
          select: {
            Id: true,
            RazonSocial: true,
            NombreFantasia: true,
            Cuit: true,
            Email: true,
            Telefono: true,
            Celular: true,
            Direccion: true,
            LocalidadId: true,
            ObservacionEnPieFactura: true,
            MostrarPreciosConIva: true,
            AbrirCajonEfectivo: true,
            NumerarPedidosPantalla: true,
            Imprimir: true,
            FacturaDescuentaStock: true,
            PresupuestoDescuentaStock: true,
            RemitoDescuentaStock: true,
            ActualizaCostoDesdeCompra: true,
            ModificaPrecioVentaDesdeCompra: true,
            TipoFormaPagoPorDefectoVenta: true,
            TipoFormaPagoPorDefectoCompra: true,
            IngresoManualCajaInicial: true,
            PuestoCajaSeparado: true,
            ActivarRetiroDeCaja: true,
            MontoMaximoRetiroCaja: true,
            UnificarRenglonesIngresarMismoProducto: true,
            ActivarBascula: true,
            EtiquetaPorPeso: true,
            CodigoBascula: true,
          },
        });

        return { config: newConfig, isNew: true };
      }
      
      // Actualizar configuración existente
      const updated = await tx.configuracion.update({
        where: { Id: config.Id, TenantId: tenantId },
        data: {
          RazonSocial: data.razonSocial,
          NombreFantasia: data.nombreFantasia ?? undefined,
          Cuit: data.cuit,
          Email: data.email ?? undefined,
          Telefono: data.telefono ?? undefined,
          Celular: data.celular ?? undefined,
          Direccion: data.direccion,
          LocalidadId: data.localidadId ? BigInt(data.localidadId) : null,
          ObservacionEnPieFactura: data.observacionPieFactura ?? undefined,
          MostrarPreciosConIva: data.mostrarPreciosConIva ?? undefined,
          AbrirCajonEfectivo: data.abrirCajonEfectivo ?? undefined,
          NumerarPedidosPantalla: data.numerarPedidosPantalla ?? undefined,
          Imprimir: data.imprimir ?? undefined,
          FacturaDescuentaStock: data.facturaDescuentaStock ?? undefined,
          PresupuestoDescuentaStock: data.presupuestoDescuentaStock ?? undefined,
          RemitoDescuentaStock: data.remitoDescuentaStock ?? undefined,
          ActualizaCostoDesdeCompra: data.actualizaCostoDesdeCompra ?? undefined,
          ModificaPrecioVentaDesdeCompra: data.modificaPrecioVentaDesdeCompra ?? undefined,
          TipoFormaPagoPorDefectoVenta: data.tipoFormaPagoPorDefectoVenta !== undefined ? data.tipoFormaPagoPorDefectoVenta : undefined,
          TipoFormaPagoPorDefectoCompra: data.tipoFormaPagoPorDefectoCompra !== undefined ? data.tipoFormaPagoPorDefectoCompra : undefined,
          IngresoManualCajaInicial: data.ingresoManualCajaInicial ?? undefined,
          PuestoCajaSeparado: data.puestoCajaSeparado ?? undefined,
          ActivarRetiroDeCaja: data.activarRetiroDeCaja ?? undefined,
          MontoMaximoRetiroCaja: data.montoMaximoRetiroCaja !== undefined ? data.montoMaximoRetiroCaja : undefined,
          UnificarRenglonesIngresarMismoProducto: data.unificarRenglonesIngresarMismoProducto ?? undefined,
          ActivarBascula: data.activarBascula ?? undefined,
          EtiquetaPorPeso: data.etiquetaPorPeso ?? undefined,
          CodigoBascula: data.codigoBascula ?? undefined,
        },
        select: {
          Id: true,
          RazonSocial: true,
          NombreFantasia: true,
          Cuit: true,
          Email: true,
          Telefono: true,
          Celular: true,
          Direccion: true,
          LocalidadId: true,
          ObservacionEnPieFactura: true,
          MostrarPreciosConIva: true,
          AbrirCajonEfectivo: true,
          NumerarPedidosPantalla: true,
          Imprimir: true,
          FacturaDescuentaStock: true,
          PresupuestoDescuentaStock: true,
          RemitoDescuentaStock: true,
          ActualizaCostoDesdeCompra: true,
          ModificaPrecioVentaDesdeCompra: true,
          TipoFormaPagoPorDefectoVenta: true,
          TipoFormaPagoPorDefectoCompra: true,
          IngresoManualCajaInicial: true,
          PuestoCajaSeparado: true,
          ActivarRetiroDeCaja: true,
          MontoMaximoRetiroCaja: true,
          UnificarRenglonesIngresarMismoProducto: true,
          ActivarBascula: true,
          EtiquetaPorPeso: true,
          CodigoBascula: true,
        },
      });

      return { config: updated, isNew: false };
    });

    const configResult = result.config;

    return NextResponse.json(
      {
        configuracion: {
          id: Number(configResult.Id),
          razonSocial: configResult.RazonSocial ?? "",
          nombreFantasia: configResult.NombreFantasia ?? "",
          cuit: configResult.Cuit ?? "",
          email: configResult.Email ?? "",
          telefono: configResult.Telefono ?? "",
          celular: configResult.Celular ?? "",
          direccion: configResult.Direccion ?? "",
          localidadId: configResult.LocalidadId ? Number(configResult.LocalidadId) : null,
          observacionPieFactura: configResult.ObservacionEnPieFactura ?? "",
          mostrarPreciosConIva: configResult.MostrarPreciosConIva ?? true,
          abrirCajonEfectivo: configResult.AbrirCajonEfectivo ?? true,
          numerarPedidosPantalla: configResult.NumerarPedidosPantalla ?? true,
          imprimir: configResult.Imprimir ?? false,
          facturaDescuentaStock: configResult.FacturaDescuentaStock ?? true,
          presupuestoDescuentaStock: configResult.PresupuestoDescuentaStock ?? false,
          remitoDescuentaStock: configResult.RemitoDescuentaStock ?? true,
          actualizaCostoDesdeCompra: configResult.ActualizaCostoDesdeCompra ?? true,
          modificaPrecioVentaDesdeCompra: configResult.ModificaPrecioVentaDesdeCompra ?? false,
          tipoFormaPagoPorDefectoVenta: configResult.TipoFormaPagoPorDefectoVenta ?? 0,
          tipoFormaPagoPorDefectoCompra: configResult.TipoFormaPagoPorDefectoCompra ?? 0,
          ingresoManualCajaInicial: configResult.IngresoManualCajaInicial ?? false,
          puestoCajaSeparado: configResult.PuestoCajaSeparado ?? false,
          activarRetiroDeCaja: configResult.ActivarRetiroDeCaja ?? false,
          montoMaximoRetiroCaja: Number(configResult.MontoMaximoRetiroCaja) ?? 0,
          unificarRenglonesIngresarMismoProducto: configResult.UnificarRenglonesIngresarMismoProducto ?? true,
          activarBascula: configResult.ActivarBascula ?? false,
          etiquetaPorPeso: configResult.EtiquetaPorPeso ?? false,
          codigoBascula: configResult.CodigoBascula ?? "",
        },
      },
      { status: result.isNew ? 201 : 200 }
    );
  } catch (error: unknown) {
    console.error("Error en PUT /api/configuracion:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return handleError(error);
  }
}
