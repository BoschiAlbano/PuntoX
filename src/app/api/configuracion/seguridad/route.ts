import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";
import prisma from "@/DB/prisma";

const seguridadSchema = z.object({
  dobleFactor: z.boolean().optional(),
  expirarSesiones: z.boolean().optional(),
  diasExpiracionSesion: z.number().int().min(1).max(365).optional(),
  bloquearTrasIntentos: z.enum(["nunca", "5", "10"]).optional(),
  alertarNuevoDispositivo: z.boolean().optional(),
  recordarSesion30Dias: z.boolean().optional(),
});

/**
 * GET: Obtiene la configuración de seguridad del tenant
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      // No requerimos permiso específico para LEER la configuración de seguridad
      // ya que es necesaria para validar sesiones de cualquier usuario
    });

    if (!tenantId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Buscar configuración del tenant
    const config = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      select: {
        Forzar2FA: true,
        ExpirarSesiones30Dias: true,
        DiasExpiracionSesion: true,
        BloquearTrasIntentos: true,
        AlertarNuevoDispositivo: true,
        RecordarSesion30Dias: true,
      },
    });

    // Si no hay configuración, retornar valores por defecto
    if (!config) {
      return NextResponse.json(
        {
          dobleFactor: false,
          expirarSesiones: true,
          diasExpiracionSesion: 30,
          bloquearTrasIntentos: "5" as const,
          alertarNuevoDispositivo: true,
          recordarSesion30Dias: true,
        },
        { status: 200 },
      );
    }

    // Convertir BloquearTrasIntentos a formato string
    const bloquearTrasIntentos =
      config.BloquearTrasIntentos === null
        ? ("nunca" as const)
        : config.BloquearTrasIntentos === 5
          ? ("5" as const)
          : config.BloquearTrasIntentos === 10
            ? ("10" as const)
            : ("5" as const);

    return NextResponse.json(
      {
        dobleFactor: config.Forzar2FA ?? false,
        expirarSesiones: config.ExpirarSesiones30Dias ?? true,
        diasExpiracionSesion: config.DiasExpiracionSesion ?? 30,
        bloquearTrasIntentos,
        alertarNuevoDispositivo: config.AlertarNuevoDispositivo ?? true,
        recordarSesion30Dias: config.RecordarSesion30Dias ?? true,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

/**
 * PUT: Actualiza la configuración de seguridad del tenant
 */
export async function PUT(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.CONFIGURACION,
    });

    if (!tenantId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const json = await req.json().catch(() => null);

    if (!json) {
      throw createError.validation("Cuerpo de la petición inválido");
    }

    const parsed = seguridadSchema.safeParse(json);

    if (!parsed.success) {
      throw createError.validation("Datos inválidos", {
        errors: parsed.error.issues,
      });
    }

    const data = parsed.data;

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
      Forzar2FA?: boolean;
      ExpirarSesiones30Dias?: boolean;
      DiasExpiracionSesion?: number;
      BloquearTrasIntentos?: number | null;
      AlertarNuevoDispositivo?: boolean;
      RecordarSesion30Dias?: boolean;
    } = {};

    if (data.dobleFactor !== undefined) {
      updateData.Forzar2FA = data.dobleFactor;
    }
    if (data.expirarSesiones !== undefined) {
      updateData.ExpirarSesiones30Dias = data.expirarSesiones;
    }
    if (data.diasExpiracionSesion !== undefined) {
      updateData.DiasExpiracionSesion = data.diasExpiracionSesion;
    }
    if (data.bloquearTrasIntentos !== undefined) {
      updateData.BloquearTrasIntentos =
        data.bloquearTrasIntentos === "nunca"
          ? null
          : parseInt(data.bloquearTrasIntentos);
    }
    if (data.alertarNuevoDispositivo !== undefined) {
      updateData.AlertarNuevoDispositivo = data.alertarNuevoDispositivo;
    }
    if (data.recordarSesion30Dias !== undefined) {
      updateData.RecordarSesion30Dias = data.recordarSesion30Dias;
    }

    // Actualizar configuración
    await prisma.configuracion.update({
      where: { Id: config.Id, TenantId: BigInt(tenantId) },
      data: updateData,
    });

    // Obtener configuración actualizada
    const updatedConfig = await prisma.configuracion.findUnique({
      where: { Id: config.Id },
      select: {
        Forzar2FA: true,
        ExpirarSesiones30Dias: true,
        DiasExpiracionSesion: true,
        BloquearTrasIntentos: true,
        AlertarNuevoDispositivo: true,
        RecordarSesion30Dias: true,
      },
    });

    // Convertir BloquearTrasIntentos a formato string
    const bloquearTrasIntentos =
      updatedConfig?.BloquearTrasIntentos === null
        ? ("nunca" as const)
        : updatedConfig?.BloquearTrasIntentos === 5
          ? ("5" as const)
          : updatedConfig?.BloquearTrasIntentos === 10
            ? ("10" as const)
            : ("5" as const);

    return NextResponse.json(
      {
        dobleFactor: updatedConfig?.Forzar2FA ?? false,
        expirarSesiones: updatedConfig?.ExpirarSesiones30Dias ?? true,
        diasExpiracionSesion: updatedConfig?.DiasExpiracionSesion ?? 30,
        bloquearTrasIntentos,
        alertarNuevoDispositivo: updatedConfig?.AlertarNuevoDispositivo ?? true,
        recordarSesion30Dias: updatedConfig?.RecordarSesion30Dias ?? true,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
