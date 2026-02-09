import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";

const fiscalSchema = z
  .object({
    moneda: z.string().optional(),
    zonaHoraria: z.string().optional(),
    idioma: z.string().optional(),
    condicionIvaId: z.number().int().positive().optional().nullable(),
    puntoVenta: z.string().optional(),
    inicioActividades: z.string().optional(), // ISO date string
    tipoIva: z.string().optional(), // Campo informativo, se ignora al guardar
  })
  .passthrough(); // Permite campos adicionales que se ignoran

export async function GET(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    permission: PERMISSIONS.CONFIGURACION,
  });
  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const config = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      select: {
        Moneda: true,
        ZonaHoraria: true,
        Idioma: true,
        CondicionIvaId: true,
        PuntoVenta: true,
        InicioActividades: true,
        CondicionIva: {
          select: {
            Id: true,
            Descripcion: true,
          },
        },
      },
      orderBy: {
        Id: "desc",
      },
    });

    if (!config) {
      // Retornar valores por defecto si no hay configuración
      return NextResponse.json(
        {
          fiscal: {
            moneda: "ARS",
            zonaHoraria: "America/Argentina/Buenos_Aires",
            idioma: "es-AR",
            tipoIva: "",
            condicionIvaId: null,
            puntoVenta: "",
            inicioActividades: "",
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        fiscal: {
          moneda: config.Moneda ?? "ARS",
          zonaHoraria: config.ZonaHoraria ?? "America/Argentina/Buenos_Aires",
          idioma: config.Idioma ?? "es-AR",
          tipoIva: config.CondicionIva?.Descripcion ?? "",
          condicionIvaId: config.CondicionIvaId
            ? Number(config.CondicionIvaId)
            : null,
          puntoVenta: config.PuntoVenta ?? "",
          inicioActividades: config.InicioActividades
            ? new Date(config.InicioActividades).toISOString().split("T")[0]
            : "",
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
    permission: PERMISSIONS.CONFIGURACION,
  });

  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = fiscalSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    // Buscar configuración existente
    const config = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      select: { Id: true },
      orderBy: {
        Id: "desc",
      },
    });

    if (!config) {
      return NextResponse.json(
        {
          error:
            "Configuración no encontrada. Debe crear la configuración primero.",
        },
        { status: 404 },
      );
    }

    // Preparar datos para actualizar
    const updateData: {
      Moneda?: string;
      ZonaHoraria?: string;
      Idioma?: string;
      CondicionIvaId?: bigint | null;
      PuntoVenta?: string;
      InicioActividades?: Date | null;
    } = {};

    if (data.moneda !== undefined) {
      updateData.Moneda = data.moneda;
    }
    if (data.zonaHoraria !== undefined) {
      updateData.ZonaHoraria = data.zonaHoraria;
    }
    if (data.idioma !== undefined) {
      updateData.Idioma = data.idioma;
    }
    if (data.condicionIvaId !== undefined) {
      updateData.CondicionIvaId = data.condicionIvaId
        ? BigInt(data.condicionIvaId)
        : null;
    }
    if (data.puntoVenta !== undefined) {
      updateData.PuntoVenta = data.puntoVenta;
    }
    if (data.inicioActividades !== undefined) {
      if (data.inicioActividades && data.inicioActividades.trim() !== "") {
        const fecha = new Date(data.inicioActividades);
        if (!isNaN(fecha.getTime())) {
          updateData.InicioActividades = fecha;
        } else {
          updateData.InicioActividades = null;
        }
      } else {
        updateData.InicioActividades = null;
      }
    }

    await prisma.configuracion.update({
      where: { Id: config.Id, TenantId: BigInt(tenantId) },
      data: updateData,
    });

    // Obtener CondicionIva actualizada para la respuesta
    const updatedConfig = await prisma.configuracion.findUnique({
      where: { Id: config.Id },
      select: {
        Moneda: true,
        ZonaHoraria: true,
        Idioma: true,
        CondicionIvaId: true,
        PuntoVenta: true,
        InicioActividades: true,
        CondicionIva: {
          select: {
            Id: true,
            Descripcion: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        fiscal: {
          moneda: updatedConfig?.Moneda ?? "ARS",
          zonaHoraria:
            updatedConfig?.ZonaHoraria ?? "America/Argentina/Buenos_Aires",
          idioma: updatedConfig?.Idioma ?? "es-AR",
          tipoIva: updatedConfig?.CondicionIva?.Descripcion ?? "",
          condicionIvaId: updatedConfig?.CondicionIvaId
            ? Number(updatedConfig.CondicionIvaId)
            : null,
          puntoVenta: updatedConfig?.PuntoVenta ?? "",
          inicioActividades: updatedConfig?.InicioActividades
            ? new Date(updatedConfig.InicioActividades)
                .toISOString()
                .split("T")[0]
            : "",
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
