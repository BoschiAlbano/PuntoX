import type { NextRequest } from "next/server";
import prisma from "@/DB/prisma";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { notificarCuentaBloqueada } from "@/lib/notificaciones/seguridad";
import { PerfilTipo } from "../../../prisma/generated/prisma";

/** Minutos sin intentos tras los cuales el contador vuelve a cero. */
export const RESET_MINUTOS = 30;

/** Datos del usuario que necesita el conteo de intentos fallidos. */
export const selectUsuarioIntentos = {
  Id: true,
  TenantId: true,
  EstaBloqueado: true,
  IntentosFallidos: true,
  FechaUltimoIntento: true,
  Persona_Empleado: { select: { Id: true } },
  PerfilUsuario: { select: { Perfiles: { select: { Tipo: true } } } },
} as const;

export interface UsuarioIntentos {
  Id: bigint;
  TenantId: bigint;
  EstaBloqueado: boolean;
  IntentosFallidos: number;
  FechaUltimoIntento: Date | null;
  Persona_Empleado: { Id: bigint } | null;
  PerfilUsuario: { Perfiles: { Tipo: PerfilTipo } }[];
}

/**
 * Suma un intento de login fallido y bloquea la cuenta si llegó al umbral
 * del tenant (Configuracion.BloquearTrasIntentos; null = nunca).
 *
 * - Administradores y superadmins nunca se bloquean solos: solo se cuenta el
 *   intento y queda en la auditoría (si no, cualquiera podría dejar a un
 *   comercio sin administrador).
 * - El contador vuelve a cero si pasaron más de RESET_MINUTOS desde el último.
 *
 * Devuelve `bloqueado: true` solo si ESTE intento bloqueó la cuenta.
 */
export async function registrarIntentoFallido(
  usuario: UsuarioIntentos,
  username: string,
  req?: NextRequest,
): Promise<{ bloqueado: boolean }> {
  if (usuario.EstaBloqueado) return { bloqueado: false };

  const esRolPrivilegiado = usuario.PerfilUsuario.some(
    (pu) =>
      pu.Perfiles.Tipo === PerfilTipo.SUPERADMIN ||
      pu.Perfiles.Tipo === PerfilTipo.ADMINISTRADOR,
  );

  if (esRolPrivilegiado) {
    await prisma.usuario.update({
      where: { Id: usuario.Id },
      data: { IntentosFallidos: { increment: 1 }, FechaUltimoIntento: new Date() },
    });
    try {
      await registrarAuditoria({
        tenantId: usuario.TenantId,
        usuarioId: usuario.Id,
        accion: "INTENTO_FALLIDO_ROL_PRIVILEGIADO",
        empleadoId: usuario.Persona_Empleado?.Id ?? null,
        usuarioAfectadoId: usuario.Id,
        detalle: `Intento de inicio de sesión fallido para usuario con rol privilegiado (sin bloqueo automático). Total acumulado: ${usuario.IntentosFallidos + 1}`,
        valorAnterior: { intentosFallidos: usuario.IntentosFallidos },
        valorNuevo: { intentosFallidos: usuario.IntentosFallidos + 1 },
        req,
      });
    } catch {
      // La auditoría no debe interrumpir el login
    }
    return { bloqueado: false };
  }

  const config = await prisma.configuracion.findFirst({
    where: { TenantId: usuario.TenantId },
    select: { BloquearTrasIntentos: true },
  });
  const umbral = config?.BloquearTrasIntentos ?? null;

  if (umbral === null) {
    await prisma.usuario.update({
      where: { Id: usuario.Id },
      data: { IntentosFallidos: { increment: 1 }, FechaUltimoIntento: new Date() },
    });
    return { bloqueado: false };
  }

  let intentosBase = usuario.IntentosFallidos;
  if (
    usuario.FechaUltimoIntento &&
    (Date.now() - usuario.FechaUltimoIntento.getTime()) / 60_000 > RESET_MINUTOS
  ) {
    intentosBase = 0;
  }
  const nuevosIntentos = intentosBase + 1;
  const debeBloquear = nuevosIntentos >= umbral;

  await prisma.usuario.update({
    where: { Id: usuario.Id },
    data: {
      IntentosFallidos: nuevosIntentos,
      FechaUltimoIntento: new Date(),
      ...(debeBloquear ? { EstaBloqueado: true } : {}),
    },
  });

  if (debeBloquear) {
    await notificarCuentaBloqueada({
      tenantId: usuario.TenantId,
      username,
      intentos: nuevosIntentos,
    });
    try {
      const plural = nuevosIntentos !== 1 ? "s" : "";
      await registrarAuditoria({
        tenantId: usuario.TenantId,
        // Sin usuario autenticado: el "actor" es el propio usuario afectado
        usuarioId: usuario.Id,
        accion: "BLOQUEO_AUTOMATICO",
        empleadoId: usuario.Persona_Empleado?.Id ?? null,
        usuarioAfectadoId: usuario.Id,
        detalle: `Cuenta bloqueada automáticamente tras ${nuevosIntentos} intento${plural} fallido${plural} de inicio de sesión`,
        valorAnterior: { estaBloqueado: false, intentosFallidos: usuario.IntentosFallidos },
        valorNuevo: { estaBloqueado: true, intentosFallidos: nuevosIntentos },
        req,
      });
    } catch {
      // La auditoría no debe interrumpir el login
    }
  }

  return { bloqueado: debeBloquear };
}
