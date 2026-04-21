import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import {
  SET_PERMISSIONS,
  TIPO_COMPROBANTE_COMPRA,
  TIPO_MOVIMIENTO,
  TIPO_PAGO,
} from "@/lib/constants/comprobantes";
import { getNextNumeroComprobante } from "@/lib/services/contadores";
import { z } from "zod";

const detalleCompraSchema = z.object({
  articuloId: z.number().int().positive(),
  codigo: z.string(),
  descripcion: z.string(),
  cantidad: z.number().positive(),
  costoUnitario: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
});

const createCompraSchema = z.object({
  proveedorId: z
    .number()
    .int()
    .positive({ message: "Debe seleccionar un proveedor" }),
  detalles: z
    .array(detalleCompraSchema)
    .min(1, "Debe agregar al menos un producto"),
  formasPago: z
    .array(
      z.object({ tipoPago: z.number().int(), monto: z.number().positive() }),
    )
    .min(1, "Debe agregar al menos una forma de pago"),
  fecha: z.string(),
});

// POST: Registrar una compra
export async function POST(req: NextRequest) {
  try {
    const { tenantId, user } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.COMPRAS,
    });

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

    if (!usuario)
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 },
      );

    const sucursalId = usuario.Sucursales[0]?.SucursalId;
    if (!sucursalId)
      return NextResponse.json(
        { error: "Sucursal no encontrada" },
        { status: 400 },
      );

    const body = await req.json();
    const parsed = createCompraSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const tenantIdBigInt = BigInt(tenantId);
    const usuarioId = usuario.Id;
    const empleadoId = usuario.EmpleadoId;

    // Verificar proveedor
    const proveedor = await prisma.proveedor.findFirst({
      where: {
        Id: BigInt(data.proveedorId),
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
    });
    if (!proveedor)
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 },
      );

    // Obtener configuración del tenant
    const configuracion = await prisma.configuracion.findFirst({
      where: { TenantId: tenantIdBigInt, EstaEliminado: false },
    });

    // Verificar caja abierta
    const caja = await prisma.caja.findFirst({
      where: {
        UsuarioAperturaId: usuarioId,
        UsuarioCierreId: null,
        EstaEliminado: false,
      },
    });
    if (!caja)
      return NextResponse.json(
        { error: "No tienes una caja abierta" },
        { status: 400 },
      );

    // Buscar artículos
    const articulosIds = data.detalles.map((d) => BigInt(d.articuloId));
    const articulos = await prisma.articulo.findMany({
      where: {
        Id: { in: articulosIds },
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      include: {
        Iva: true,
        Precios: true,
        ArticuloStock: { where: { SucursalId: sucursalId } },
      },
    });

    if (articulos.length !== data.detalles.length) {
      return NextResponse.json(
        { error: "Uno o más artículos no fueron encontrados" },
        { status: 404 },
      );
    }

    // Calcular totales
    const subtotalCompra = data.detalles.reduce(
      (sum, d) => sum + d.subtotal,
      0,
    );
    const totalFormasPago = data.formasPago.reduce(
      (sum, fp) => sum + fp.monto,
      0,
    );
    if (Math.abs(totalFormasPago - subtotalCompra) > 0.01) {
      return NextResponse.json(
        {
          error: `El total de formas de pago ($${totalFormasPago}) no coincide con el total ($${subtotalCompra})`,
        },
        { status: 400 },
      );
    }

    // --- TRANSACTION ---
    const resultado = await prisma.$transaction(
      async (tx) => {
        const fechaCompra = new Date(data.fecha);

        // 1. Número de comprobante
        const numero = await getNextNumeroComprobante(
          tenantIdBigInt,
          TIPO_COMPROBANTE_COMPRA.COMPRA,
          null,
          tx,
        );

        // 2. Cabecera Comprobante
        const comprobante = await tx.comprobante.create({
          data: {
            EmpleadoId: empleadoId,
            UsuarioId: usuarioId,
            Fecha: fechaCompra,
            Numero: numero,
            SubTotal: subtotalCompra,
            Descuento: 0,
            Total: subtotalCompra,
            Iva21: 0,
            Iva105: 0,
            TipoComprobante: TIPO_COMPROBANTE_COMPRA.COMPRA,
            EstaEliminado: false,
            TenantId: tenantIdBigInt,
            SucursalId: sucursalId,
          },
        });

        // 3. Comprobante_Compra (datos adicionales de compra)
        await tx.comprobante_Compra.create({
          data: {
            Id: comprobante.Id,
            ProveedorId: BigInt(data.proveedorId),
            FechaEntrega: fechaCompra,
            Iva27: 0,
            PrecepcionTemp: 0,
            PrecepcionPyP: 0,
            PrecepcionIva: 0,
            PrecepcionIB: 0,
            EstadoFactura: 1, // Pendiente
          },
        });

        // 4. Renglones (DetalleComprobante) + Stock + Precios
        for (const detalle of data.detalles) {
          const articulo = articulos.find(
            (a) => Number(a.Id) === detalle.articuloId,
          )!;

          // 4a. Crear renglon
          await tx.detalleComprobante.create({
            data: {
              ComprobanteId: comprobante.Id,
              ArticuloId: articulo.Id,
              Codigo: detalle.codigo,
              Descripcion: detalle.descripcion,
              Cantidad: detalle.cantidad,
              Iva: Number(articulo.Iva?.Porcentaje ?? 0),
              Precio: detalle.costoUnitario,
              SubTotal: detalle.subtotal,
              Costo: detalle.costoUnitario,
              EstaEliminado: false,
              TenantId: tenantIdBigInt,
            },
          });

          // 4b. Incrementar stock
          const stockExistente = articulo.ArticuloStock[0];
          if (stockExistente) {
            await tx.articuloStock.update({
              where: { Id: stockExistente.Id },
              data: { Stock: { increment: detalle.cantidad } },
            });
          } else {
            await tx.articuloStock.create({
              data: {
                ArticuloId: articulo.Id,
                SucursalId: sucursalId,
                Stock: detalle.cantidad,
                TenantId: tenantIdBigInt,
              },
            });
          }

          // 4c. Actualizar costo si configuración lo indica
          if (configuracion?.ActualizaCostoDesdeCompra) {
            const nuevoPrecioCosto = detalle.costoUnitario;
            const updateListasPromises: any[] = [];

            // 4d. Recalcular precio venta si la config lo pide
            if (configuracion.ModificaPrecioVentaDesdeCompra) {

              // Recalcular listas de precios dinámicas
              if (articulo.Precios) {
                for (const pl of articulo.Precios) {
                  const ganancia = Number(pl.PorcentajeGanancia);
                  if (ganancia > 0) {
                    const nuevoPrecioFinal = nuevoPrecioCosto * (1 + ganancia / 100);
                    updateListasPromises.push(
                      tx.precioLista.update({
                        where: { Id: pl.Id },
                        data: { PrecioFinal: nuevoPrecioFinal },
                      })
                    );
                  }
                }
              }
            }

            await tx.articulo.update({
              where: { Id: articulo.Id },
              data: {
                PrecioCosto: nuevoPrecioCosto,
              },
            });

            // Ejecutar actualizaciones de listas en paralelo
            if (updateListasPromises.length > 0) {
              await Promise.all(updateListasPromises);
            }
          }
        }

        // 5. Formas de pago + actualización Caja por tipo
        for (const pago of data.formasPago) {
          await tx.formaPago.create({
            data: {
              ComprobanteId: comprobante.Id,
              TipoPago: pago.tipoPago,
              Monto: pago.monto,
              EstaEliminado: false,
              TenantId: tenantIdBigInt,
            },
          });

          // Determinar el campo TotalSalidaXxx según el tipo de pago
          let fieldToUpdate: string | undefined;
          switch (pago.tipoPago) {
            case TIPO_PAGO.EFECTIVO:
              fieldToUpdate = "TotalSalidaEfectivo";
              break;
            case TIPO_PAGO.TARJETA:
              fieldToUpdate = "TotalSalidaTarjeta";
              break;
            case TIPO_PAGO.CHEQUE:
              fieldToUpdate = "TotalSalidaCheque";
              break;
            case TIPO_PAGO.CUENTA_CORRIENTE:
              fieldToUpdate = "TotalSalidaCtaCte";
              break;
            case TIPO_PAGO.TRANSFERENCIA:
              fieldToUpdate = "TotalSalidaTransf";
              break;
          }

          if (fieldToUpdate) {
            // Actualizar campo de salida en Caja
            await tx.caja.update({
              where: { Id: caja.Id },
              data: { [fieldToUpdate]: { increment: pago.monto } },
            });
          }

          // Actualizar o crear DetalleCaja (registra en negativo porque es salida)
          const existingDetalle = await tx.detalleCaja.findFirst({
            where: {
              CajaId: caja.Id,
              TipoPago: pago.tipoPago,
              TenantId: tenantIdBigInt,
              EstaEliminado: false,
            },
          });
          if (existingDetalle) {
            await tx.detalleCaja.update({
              where: { Id: existingDetalle.Id },
              data: { Monto: { decrement: pago.monto } },
            });
          } else {
            await tx.detalleCaja.create({
              data: {
                CajaId: caja.Id,
                TipoPago: pago.tipoPago,
                Monto: -pago.monto,
                EstaEliminado: false,
                TenantId: tenantIdBigInt,
              },
            });
          }
        }

        // 6. Movimiento de SALIDA en caja (egreso de dinero)
        const movimiento = await tx.movimiento.create({
          data: {
            CajaId: caja.Id,
            ComprobanteId: comprobante.Id,
            UsuarioId: usuarioId,
            Monto: subtotalCompra,
            Fecha: fechaCompra,
            Descripcion: `Compra a proveedor: ${proveedor.RazonSocial} - Comprobante #${numero}`,
            TipoMovimiento: TIPO_MOVIMIENTO.SALIDA,
            EstaEliminado: false,
            TenantId: tenantIdBigInt,
            SucursalId: sucursalId,
          },
        });

        // 7. Cta Cte Proveedor
        const hasCtaCte = data.formasPago.some(
          (fp) => fp.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE,
        );
        if (hasCtaCte) {
          await tx.movimiento_CuentaCorrienteProveedor.create({
            data: {
              Id: movimiento.Id,
              ProveedorId: BigInt(data.proveedorId),
            },
          });
          await tx.comprobante_CtaCteProveedor.create({
            data: {
              Id: comprobante.Id,
              ProveedorId: BigInt(data.proveedorId),
              Estado: 1, // Ej: 1 para Deuda Pendiente
            },
          });
        }

        return comprobante;
      },
      { timeout: 30000 },
    );

    return NextResponse.json(
      {
        comprobante: {
          id: Number(resultado.Id),
          numero: resultado.Numero,
          total: Number(resultado.Total),
          fecha: resultado.Fecha.toISOString(),
        },
        message: "Compra registrada con éxito",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
