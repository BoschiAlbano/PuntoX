import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma"; // Assuming this is the correct path for prisma client
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import {
  GET_PERMISSIONS,
  SET_PERMISSIONS,
  TIPO_COMPROBANTE_VENTA,
} from "@/lib/constants/comprobantes";
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
import { triggerStockBajoNotifications } from "@/lib/services/notificaciones";
import { isFacturacionElectronicaHabilitada, autorizarComprobante } from "@/lib/services/facturacion.service";
import { requiereAutorizacionAfip } from "@/lib/constants/afip";

// POST: Crear comprobante (venta)
export async function POST(req: NextRequest) {
  try {
    const { tenantId, user } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.VENTAS,
    });

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
          ArticulosCombo: {
            include: {
              Componente: {
                include: {
                  ArticuloStock: {
                    where: { SucursalId: sucursalId },
                  },
                },
              },
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

    // Validar stock si corresponde (acumulado)
    const stockRequerido = new Map<number, { required: number; available: number; permitsNegative: boolean; name: string; comboNames: string[] }>();

    for (const detalle of data.detalles) {
      const articulo = articulos.find((a) => Number(a.Id) === detalle.articuloId);
      if (!articulo || !articulo.DescuentaStock) continue;

      if (articulo.EsCombo && articulo.ArticulosCombo && articulo.ArticulosCombo.length > 0) {
        for (const item of articulo.ArticulosCombo) {
          const componente = item.Componente;
          if (!componente) continue;

          const compId = Number(componente.Id);
          const reqQty = detalle.cantidad * Number(item.CantidadRequerida);
          const available = componente.ArticuloStock[0]?.Stock ? Number(componente.ArticuloStock[0].Stock) : 0;

          if (!stockRequerido.has(compId)) {
            stockRequerido.set(compId, { required: 0, available, permitsNegative: componente.PermiteStockNegativo, name: componente.Descripcion, comboNames: [] });
          }

          const entry = stockRequerido.get(compId)!;
          entry.required += reqQty;
          entry.comboNames.push(articulo.Descripcion);
        }
      } else {
        const artId = Number(articulo.Id);
        const reqQty = detalle.cantidad;
        const available = articulo.ArticuloStock[0]?.Stock ? Number(articulo.ArticuloStock[0].Stock) : 0;

        if (!stockRequerido.has(artId)) {
          stockRequerido.set(artId, { required: 0, available, permitsNegative: articulo.PermiteStockNegativo, name: articulo.Descripcion, comboNames: [] });
        }

        const entry = stockRequerido.get(artId)!;
        entry.required += reqQty;
      }
    }

    // Ejecutar la validación real con los totales consolidados
    for (const [_, req] of stockRequerido.entries()) {
      if (req.available < req.required && !req.permitsNegative) {
        // Formatear mensaje para que sea claro si el componente es parte de un combo
        const comboContext = req.comboNames.length > 0 
          ? ` (requerido por: ${Array.from(new Set(req.comboNames)).join(", ")})` 
          : "";

        return NextResponse.json(
          {
            error: `Stock insuficiente para ${req.name}${comboContext}. Requerido: ${req.required}, Disponible: ${req.available}`,
          },
          { status: 400 },
        );
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
      const baseImponible = detalle.subtotal * (1 - (subtotal > 0 ? descuento / subtotal : 0));

      detalle.iva = porcentajeIva;
      // Guardamos el costo total del renglón (precio de costo * cantidad)
      detalle.costo = Number(articulo.PrecioCosto) * detalle.cantidad;

      if (porcentajeIva === 21) {
        iva21 += (baseImponible * 21) / 121;
        // detalle.iva = (baseImponible * 21) / 121;
      } else if (porcentajeIva === 10.5) {
        iva105 += (baseImponible * 10.5) / 110.5;
        // detalle.iva = (baseImponible * 10.5) / 110.5;
      }
    }

    const total = subtotalConDescuento;

    // Determinar si es venta diferida (PuestoCajaSeparado activo y tipo es Factura A/B/C)
    const esDiferido =
      !!configuracion?.PuestoCajaSeparado &&
      (
        [
          TIPO_COMPROBANTE_VENTA.FACTURA_A,
          TIPO_COMPROBANTE_VENTA.FACTURA_B,
          TIPO_COMPROBANTE_VENTA.FACTURA_C,
        ] as number[]
      ).includes(data.tipoComprobante);

    // Validar formas de pago (solo si no es diferido)
    const totalFormasPago = data.formasPago.reduce(
      (sum, fp) => sum + fp.monto,
      0,
    );

    if (!esDiferido && Math.abs(totalFormasPago - total) > 0.01) {
      return NextResponse.json(
        {
          error: `El total de formas de pago (${totalFormasPago}) no coincide con el total de la venta (${total})`,
        },
        { status: 400 },
      );
    }

    // Find Open Caja (solo si no es diferido)
    let cajaId: bigint | undefined;

    if (!esDiferido) {
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

      cajaId = caja.Id;
    }

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
            esDiferido,
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
            esDiferido,
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
            esDiferido,
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
            cajaId,
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
            cajaId,
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

    // Post-transacción: verificar stock bajo y emitir notificaciones (fire-and-forget)
    // Solo si el comprobante descontó stock y la preferencia está habilitada
    if (descuentaStock && configuracion?.NotificacionesStockBajo !== false) {
      const affectedArticuloIds = data.detalles
        .filter((d) =>
          articulos.find((a) => Number(a.Id) === d.articuloId)?.DescuentaStock,
        )
        .map((d) => BigInt(d.articuloId));

      if (affectedArticuloIds.length > 0) {
        triggerStockBajoNotifications(
          tenantIdBigInt,
          sucursalId,
          affectedArticuloIds,
        ).catch((err) =>
          console.error("[stockBajo] Error al verificar notificaciones:", err),
        );
      }
    }

    // Integración con ARCA (Facturación Electrónica)
    let arcaResult = null;
    if (
      !esDiferido &&
      requiereAutorizacionAfip(data.tipoComprobante)
    ) {
      try {
        const arcaHabilitada = await isFacturacionElectronicaHabilitada(tenantIdBigInt);
        if (arcaHabilitada) {
          arcaResult = await autorizarComprobante(resultado.Id, tenantIdBigInt, sucursalId);
          if (!arcaResult.success) {
            console.warn(
              `[ARCA] Comprobante ${resultado.Id} rechazado:`,
              `\n  Errores: ${arcaResult.errores}`,
              `\n  Observaciones: ${arcaResult.observaciones}`,
              `\n  Resultado: ${arcaResult.resultado}`,
            );
          }
        }
      } catch (err) {
        console.error("[ARCA] Error no manejado al autorizar comprobante:", err);
      }
    }

    return NextResponse.json(
      {
        comprobante: {
          id: Number(resultado.Id),
          numero: resultado.Numero,
          tipoComprobante: resultado.TipoComprobante,
          total: Number(resultado.Total),
          fecha: resultado.Fecha.toISOString(),
          esDiferido,
          arcaStatus: arcaResult ? (arcaResult.success ? 'AUTORIZADO' : 'RECHAZADO') : null,
          cae: arcaResult?.cae,
          caeFchVto: arcaResult?.caeFchVto,
          arcaErrores: arcaResult?.success === false
            ? [arcaResult.errores, arcaResult.observaciones].filter(Boolean).join(' | ')
            : undefined,
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
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.VENTAS,
    });

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
          FacturaElectronica: true,
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

// PATCH: Actualizar fecha o tipo de comprobante con FE rechazada
export async function PATCH(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({ req });

    const body = await req.json();
    const { comprobanteId, fecha, tipoComprobante } = body;

    if (!comprobanteId || (!fecha && !tipoComprobante)) {
      return NextResponse.json(
        { error: "comprobanteId y fecha o tipoComprobante son requeridos" },
        { status: 400 },
      );
    }

    const tenantIdBigInt = BigInt(tenantId);
    const comprobanteIdBigInt = BigInt(comprobanteId);

    // Buscar el comprobante
    const comprobante = await prisma.comprobante.findUnique({
      where: {
        Id: comprobanteIdBigInt,
        TenantId: tenantIdBigInt,
      },
      include: {
        FacturaElectronica: true,
      },
    });

    if (!comprobante) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 },
      );
    }

    // Solo permitir editar si tiene FE y está RECHAZADO
    if (!comprobante.FacturaElectronica) {
      return NextResponse.json(
        { error: "Este comprobante no tiene factura electrónica asociada" },
        { status: 400 },
      );
    }

    if (comprobante.FacturaElectronica.Estado !== "RECHAZADO") {
      return NextResponse.json(
        { error: "Solo se pueden editar comprobantes con FE rechazada" },
        { status: 400 },
      );
    }

    const updateData: any = {};

    if (fecha) {
      const fechaDate = new Date(fecha);
      if (isNaN(fechaDate.getTime())) {
        return NextResponse.json(
          { error: "Fecha inválida" },
          { status: 400 },
        );
      }
      updateData.Fecha = fechaDate;
    }

    if (tipoComprobante) {
      const tipoValido = Object.values(TIPO_COMPROBANTE_VENTA).includes(tipoComprobante);
      if (!tipoValido) {
        return NextResponse.json(
          { error: "Tipo de comprobante inválido" },
          { status: 400 },
        );
      }
      updateData.TipoComprobante = tipoComprobante;
    }

    // Actualizar el comprobante
    await prisma.comprobante.update({
      where: { Id: comprobanteIdBigInt },
      data: updateData,
    });

    // Limpiar el estado de la FE para que se pueda reintentar
    await prisma.facturaElectronica.update({
      where: { Id: comprobante.FacturaElectronica.Id },
      data: {
        Estado: "PENDIENTE",
        Observaciones: null,
        CAE: null,
        CAEFchVto: null,
        Resultado: null,
      },
    });

    return NextResponse.json({
      message: "Comprobante actualizado correctamente",
      ...(fecha && { fecha: new Date(fecha) }),
      ...(tipoComprobante && { tipoComprobante }),
    });
  } catch (error) {
    return handleError(error);
  }
}
