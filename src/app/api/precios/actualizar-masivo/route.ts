import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import {
  actualizarPreciosMasivoSchema,
  type TipoAjustePrecio,
  type TipoRedondeo,
} from "@/lib/validations/actualizar-precios.schema";

// ─── Helpers de cálculo ────────────────────────────────────────────────────

/**
 * Aplica el ajuste sobre una base (PrecioFinal o PrecioCosto según objetivo).
 * El valor siempre es positivo; el tipo determina dirección e interpretación.
 */
function calcularNuevoPrecio(
  tipo: TipoAjustePrecio,
  valor: number,
  base: number,
): number | null {
  let nuevo: number;

  switch (tipo) {
    case "incremento_porcentaje":
      nuevo = base * (1 + valor / 100);
      break;
    case "decremento_porcentaje":
      nuevo = base * (1 - valor / 100);
      break;
    case "incremento_fijo":
      nuevo = base + valor;
      break;
    case "decremento_fijo":
      nuevo = base - valor;
      break;
    default:
      return null;
  }

  if (nuevo < 0) return null;
  return nuevo;
}

/**
 * Aplica el redondeo configurado al precio calculado.
 */
function aplicarRedondeo(precio: number, tipo: TipoRedondeo): number {
  switch (tipo) {
    case "ceil":
      // Entero superior: $1234.50 → $1235
      return Math.ceil(precio);

    case "ceil_99": {
      // Al 99 más cercano superior: $1234.50 → $1299, $1299 → $1299, $1300 → $1399
      const base = Math.floor(precio / 100);
      const resto = precio % 100;
      return resto <= 99 && precio === base * 100 + 99
        ? precio // ya es _99, no tocar
        : (base + 1) * 100 - 1; // siguiente _99
    }

    case "floor":
      // Entero inferior: $1234.50 → $1234
      return Math.floor(precio);

    case "none":
    default:
      // Redondeo monetario estándar a 2 decimales
      return Math.round(precio * 100) / 100;
  }
}

// ─── Handler principal ─────────────────────────────────────────────────────

/**
 * PATCH /api/precios/actualizar-masivo
 *
 * Aplica una regla de actualización de precios a N artículos,
 * sobre TODAS las listas de precio que cada artículo ya tenga registradas.
 *
 * Regla de negocio clave:
 *   - Solo actualiza registros PrecioLista EXISTENTES (UPDATE).
 *   - NUNCA crea registros nuevos en PrecioLista (INSERT).
 *   - Si un artículo no tiene precio en una lista → esa lista se ignora.
 *
 * Body: { articuloIds, tipo, valor, redondear, redondeoTipo }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.PRODUCTOS,
    });

    const body = await req.json();

    // ── Validar body con Zod ───────────────────────────────────────────────
    const input = actualizarPreciosMasivoSchema.parse(body);

    const tenantIdBigInt = BigInt(tenantId);
    const articuloIdsBigInt = input.articuloIds.map((id) => BigInt(id));

    // ── 1. Obtener artículos con su PrecioCosto y PreciosLista actuales ────
    const articulos = await prisma.articulo.findMany({
      where: {
        Id: { in: articuloIdsBigInt },
        TenantId: tenantIdBigInt,
      },
      select: {
        Id: true,
        PrecioCosto: true,
        Precios: {
          select: {
            Id: true,
            ListaPrecioId: true,
            PorcentajeGanancia: true,
            PrecioFinal: true,
          },
          where: {
            // Solo listas activas y no eliminadas
            ListaPrecio: {
              Activa: true,
              EstaEliminado: false,
              // Filtrar por lista específica cuando corresponde
              ...(input.objetivo === "lista_especifica" &&
              input.listaPrecioId != null
                ? { Id: BigInt(input.listaPrecioId) }
                : {}),
            },
          },
        },
      },
    });

    if (articulos.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron artículos válidos para actualizar" },
        { status: 404 },
      );
    }

    // ── 2. Calcular y preparar operaciones según objetivo ─────────────────
    type UpdatePrecioLista = {
      precioListaId: bigint;
      nuevoPrecioFinal: number;
      nuevoPorcentajeGanancia: number;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articuloUpdates: any[] = [];
    const precioListaOps: UpdatePrecioLista[] = [];
    const errores: string[] = [];

    for (const articulo of articulos) {
      const precioCosto = Number(articulo.PrecioCosto);

      // ── Objetivo COSTO: actualiza PrecioCosto y recalcula listas por markup
      if (input.objetivo === "costo") {
        const nuevoCostoRaw = calcularNuevoPrecio(
          input.tipo,
          input.valor,
          precioCosto, // base = PrecioCosto
        );

        if (nuevoCostoRaw === null || nuevoCostoRaw <= 0) {
          errores.push(
            `Artículo Id=${articulo.Id}: el costo resultante sería inválido (${nuevoCostoRaw})`,
          );
          continue;
        }

        const nuevoCosto = input.redondear
          ? aplicarRedondeo(nuevoCostoRaw, input.redondeoTipo)
          : Math.round(nuevoCostoRaw * 100) / 100;

        articuloUpdates.push(
          prisma.articulo.update({
            where: { Id: articulo.Id },
            data: { PrecioCosto: nuevoCosto },
            select: { Id: true },
          }),
        );

        for (const precioLista of articulo.Precios) {
          const porcentaje = Number(precioLista.PorcentajeGanancia);
          const nuevoPrecioRaw = nuevoCosto * (1 + porcentaje / 100);
          if (nuevoPrecioRaw < 0) continue;

          const precioFinal = input.redondear
            ? aplicarRedondeo(nuevoPrecioRaw, input.redondeoTipo)
            : Math.round(nuevoPrecioRaw * 100) / 100;

          precioListaOps.push({
            precioListaId: precioLista.Id,
            nuevoPrecioFinal: precioFinal,
            nuevoPorcentajeGanancia: porcentaje, // mantiene el mismo markup
          });
        }
        continue;
      }

      // ── Objetivo LISTAS (todas o específica, el filtro ya fue aplicado en la query)
      for (const precioLista of articulo.Precios) {
        const precioActual = Number(precioLista.PrecioFinal);

        const nuevoPrecio = calcularNuevoPrecio(
          input.tipo,
          input.valor,
          precioActual, // base = PrecioFinal de la lista
        );

        if (nuevoPrecio === null || nuevoPrecio < 0) {
          errores.push(
            `Artículo Id=${articulo.Id} / Lista Id=${precioLista.ListaPrecioId}: el precio resultante sería inválido (${nuevoPrecio})`,
          );
          continue;
        }

        const precioFinal = input.redondear
          ? aplicarRedondeo(nuevoPrecio, input.redondeoTipo)
          : Math.round(nuevoPrecio * 100) / 100;

        const nuevoPorcentajeGanancia =
          precioCosto > 0
            ? Math.round((precioFinal / precioCosto - 1) * 100 * 100) / 100
            : 0;

        precioListaOps.push({
          precioListaId: precioLista.Id,
          nuevoPrecioFinal: precioFinal,
          nuevoPorcentajeGanancia,
        });
      }
    }

    if (articuloUpdates.length === 0 && precioListaOps.length === 0) {
      return NextResponse.json(
        {
          error:
            "No hay precios para actualizar. Los artículos seleccionados no tienen precios en listas activas, o todos los cálculos resultaron inválidos.",
          detalles: errores,
        },
        { status: 422 },
      );
    }

    // ── 3. Ejecutar todos los updates dentro de una transacción ───────────
    const precioListaUpdates = precioListaOps.map((op) =>
      prisma.precioLista.update({
        where: { Id: op.precioListaId },
        data: {
          PrecioFinal: op.nuevoPrecioFinal,
          PorcentajeGanancia: op.nuevoPorcentajeGanancia,
        },
        select: { Id: true },
      }),
    );

    await prisma.$transaction([...articuloUpdates, ...precioListaUpdates]);

    // ── 4. Respuesta ───────────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        articulosActualizados: articulos.length,
        preciosActualizados: precioListaOps.length,
        ...(errores.length > 0 && { advertencias: errores }),
      },
      { status: 200 },
    );
  } catch (error) {
    return handleError(error);
  }
}
