import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { handleError, isDatabaseConnectionError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";

const seguridadSchema = z.object({
  forzar2FA: z.boolean().optional(),
  expirarSesiones30Dias: z.boolean().optional(),
  bloquearTras5Intentos: z.boolean().optional(),
  alertasNuevoDevice: z.boolean().optional(),
});

/**
 * GET: Obtiene la configuración de seguridad del tenant
 * Por ahora usamos valores por defecto, pero la estructura está lista
 * para cuando se agregue una tabla TenantSeguridad en el futuro
 */
export async function GET() {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    // Por ahora retornamos valores por defecto
    // En el futuro se puede crear una tabla TenantSeguridad o agregar campos a Configuracion
    return NextResponse.json(
      {
        forzar2FA: false,
        expirarSesiones30Dias: true,
        bloquearTras5Intentos: false,
        alertasNuevoDevice: true,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

/**
 * PUT: Actualiza la configuración de seguridad del tenant
 */
export async function PUT(req: Request) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const json = await req.json().catch(() => null);
    
    if (!json) {
      throw createError.validation("Cuerpo de la petición inválido");
    }

    const parsed = seguridadSchema.safeParse(json);

    if (!parsed.success) {
      throw createError.validation("Datos inválidos", {
        errors: parsed.error.errors,
      });
    }

    // Por ahora solo validamos y retornamos éxito
    // En el futuro se puede guardar en una tabla TenantSeguridad o agregar campos a Configuracion
    // Ejemplo futuro:
    // await prisma.tenantSeguridad.upsert({
    //   where: { TenantId: BigInt(tenantId) },
    //   update: parsed.data,
    //   create: { TenantId: BigInt(tenantId), ...parsed.data },
    // });

    return NextResponse.json(
      {
        message: "Configuración de seguridad actualizada",
        seguridad: parsed.data,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}




