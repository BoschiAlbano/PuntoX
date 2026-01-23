import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";

const payloadSchema = z.object({
  razonSocial: z.string().min(1, "Razon social requerida"),
  nombreFantasia: z.string().optional().nullable(),
  cuit: z.string().min(1, "CUIT requerido"),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  celular: z.string().optional().nullable(),
  direccion: z.string().min(1, "Dirección requerida"),
  localidadId: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined || val === "") {
          return null;
        }
        const num =
          typeof val === "string"
            ? Number(val)
            : typeof val === "number"
              ? val
              : null;
        if (num === null || Number.isNaN(num) || num <= 0) {
          return null;
        }
        return num;
      },
      z.union([
        z.number().int().positive("Debe seleccionar una localidad válida"),
        z.null(),
      ]),
    )
    .refine((val) => val !== null && val > 0, {
      message: "Debe seleccionar una localidad",
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

export async function GET(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    // permission: "configuracion",
  });

  if (!tenantId) {
    return NextResponse.json(
      {
        error:
          "No se pudo determinar el tenant. Por favor, cierra sesión y vuelve a iniciar sesión.",
      },
      { status: 401 },
    );
  }

  try {
    // Optimización: Usar findFirst con orderBy para obtener la configuración más reciente
    // Nota: Para mejor performance, considerar índice compuesto en: (TenantId, EstaEliminado, Id DESC)
    const config = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
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
        Id: "desc",
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuracion no encontrada" },
        { status: 404 },
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
          departamentoId: config.Localidad?.DepartamentoId
            ? Number(config.Localidad.DepartamentoId)
            : null,
          provinciaId: config.Localidad?.Departamento?.ProvinciaId
            ? Number(config.Localidad.Departamento.ProvinciaId)
            : null,
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
          tipoFormaPagoPorDefectoVenta:
            config.TipoFormaPagoPorDefectoVenta ?? 0,
          tipoFormaPagoPorDefectoCompra:
            config.TipoFormaPagoPorDefectoCompra ?? 0,
          ingresoManualCajaInicial: config.IngresoManualCajaInicial ?? false,
          puestoCajaSeparado: config.PuestoCajaSeparado ?? false,
          activarRetiroDeCaja: config.ActivarRetiroDeCaja ?? false,
          montoMaximoRetiroCaja: Number(config.MontoMaximoRetiroCaja) ?? 0,
          unificarRenglonesIngresarMismoProducto:
            config.UnificarRenglonesIngresarMismoProducto ?? true,
          activarBascula: config.ActivarBascula ?? false,
          etiquetaPorPeso: config.EtiquetaPorPeso ?? false,
          codigoBascula: config.CodigoBascula ?? "",
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    permission: "configuracion",
  });

  if (!tenantId) {
    return NextResponse.json(
      {
        error:
          "No se pudo determinar el tenant. Por favor, cierra sesión y vuelve a iniciar sesión.",
      },
      { status: 401 },
    );
  }

  const json = await req.json().catch(() => null);
  if (!json) {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido" },
      { status: 400 },
    );
  }

  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    const errorIssues = parsed.error.issues || [];
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
        Id: "desc",
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
            ModificaPrecioVentaDesdeCompra:
              data.modificaPrecioVentaDesdeCompra ?? false,
            Imprimir: data.imprimir ?? false,
            Instalada: 1,
            TipoFormaPagoPorDefectoVenta:
              data.tipoFormaPagoPorDefectoVenta ?? 0,
            TipoFormaPagoPorDefectoCompra:
              data.tipoFormaPagoPorDefectoCompra ?? 0,
            UnificarRenglonesIngresarMismoProducto:
              data.unificarRenglonesIngresarMismoProducto ?? true,
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
          PresupuestoDescuentaStock:
            data.presupuestoDescuentaStock ?? undefined,
          RemitoDescuentaStock: data.remitoDescuentaStock ?? undefined,
          ActualizaCostoDesdeCompra:
            data.actualizaCostoDesdeCompra ?? undefined,
          ModificaPrecioVentaDesdeCompra:
            data.modificaPrecioVentaDesdeCompra ?? undefined,
          TipoFormaPagoPorDefectoVenta:
            data.tipoFormaPagoPorDefectoVenta !== undefined
              ? data.tipoFormaPagoPorDefectoVenta
              : undefined,
          TipoFormaPagoPorDefectoCompra:
            data.tipoFormaPagoPorDefectoCompra !== undefined
              ? data.tipoFormaPagoPorDefectoCompra
              : undefined,
          IngresoManualCajaInicial: data.ingresoManualCajaInicial ?? undefined,
          PuestoCajaSeparado: data.puestoCajaSeparado ?? undefined,
          ActivarRetiroDeCaja: data.activarRetiroDeCaja ?? undefined,
          MontoMaximoRetiroCaja:
            data.montoMaximoRetiroCaja !== undefined
              ? data.montoMaximoRetiroCaja
              : undefined,
          UnificarRenglonesIngresarMismoProducto:
            data.unificarRenglonesIngresarMismoProducto ?? undefined,
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
          localidadId: configResult.LocalidadId
            ? Number(configResult.LocalidadId)
            : null,
          observacionPieFactura: configResult.ObservacionEnPieFactura ?? "",
          mostrarPreciosConIva: configResult.MostrarPreciosConIva ?? true,
          abrirCajonEfectivo: configResult.AbrirCajonEfectivo ?? true,
          numerarPedidosPantalla: configResult.NumerarPedidosPantalla ?? true,
          imprimir: configResult.Imprimir ?? false,
          facturaDescuentaStock: configResult.FacturaDescuentaStock ?? true,
          presupuestoDescuentaStock:
            configResult.PresupuestoDescuentaStock ?? false,
          remitoDescuentaStock: configResult.RemitoDescuentaStock ?? true,
          actualizaCostoDesdeCompra:
            configResult.ActualizaCostoDesdeCompra ?? true,
          modificaPrecioVentaDesdeCompra:
            configResult.ModificaPrecioVentaDesdeCompra ?? false,
          tipoFormaPagoPorDefectoVenta:
            configResult.TipoFormaPagoPorDefectoVenta ?? 0,
          tipoFormaPagoPorDefectoCompra:
            configResult.TipoFormaPagoPorDefectoCompra ?? 0,
          ingresoManualCajaInicial:
            configResult.IngresoManualCajaInicial ?? false,
          puestoCajaSeparado: configResult.PuestoCajaSeparado ?? false,
          activarRetiroDeCaja: configResult.ActivarRetiroDeCaja ?? false,
          montoMaximoRetiroCaja:
            Number(configResult.MontoMaximoRetiroCaja) ?? 0,
          unificarRenglonesIngresarMismoProducto:
            configResult.UnificarRenglonesIngresarMismoProducto ?? true,
          activarBascula: configResult.ActivarBascula ?? false,
          etiquetaPorPeso: configResult.EtiquetaPorPeso ?? false,
          codigoBascula: configResult.CodigoBascula ?? "",
        },
      },
      { status: result.isNew ? 201 : 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
