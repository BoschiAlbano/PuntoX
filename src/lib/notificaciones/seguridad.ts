/**
 * Notificaciones in-app de seguridad (sin email):
 * - Inicio de sesión desde un dispositivo nuevo (si el comercio tiene activado
 *   "Alertar nuevo dispositivo").
 * - Cuenta bloqueada por intentos fallidos (a los administradores).
 * - Contraseña cambiada por un administrador (al empleado).
 * - Verificación en dos pasos activada / desactivada.
 * Ninguna lanza: se registran los errores y la operación sigue.
 */
import prisma from "@/DB/prisma";
import { notificarAdministradores, notificarUsuarios } from "./notificar";

export const ENTIDAD_SEGURIDAD = "SEGURIDAD";

const fechaHora = (d: Date) =>
  d.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

/** Nombre legible del navegador/sistema a partir del user-agent. */
export function describirDispositivo(userAgent: string | null, dispositivo?: string | null): string {
  if (!userAgent) return dispositivo || "un dispositivo desconocido";
  const navegador = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "un navegador";
  const sistema = /Windows/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
      ? "Android"
      : /iPhone|iPad|iOS/.test(userAgent)
        ? "iPhone/iPad"
        : /Mac OS X|Macintosh/.test(userAgent)
          ? "Mac"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "otro sistema";
  return `${navegador} en ${sistema}`;
}

export async function notificarNuevoDispositivo(params: {
  tenantId: bigint;
  usuarioId: bigint;
  userAgent: string | null;
  dispositivo?: string | null;
  ipAddress: string;
  ahora?: Date;
}): Promise<boolean> {
  try {
    const config = await prisma.configuracion.findFirst({
      where: { TenantId: params.tenantId, EstaEliminado: false },
      orderBy: { Id: "desc" },
      select: { AlertarNuevoDispositivo: true },
    });
    if (!config?.AlertarNuevoDispositivo) return false;

    const donde = describirDispositivo(params.userAgent, params.dispositivo);
    const ip = params.ipAddress && params.ipAddress !== "unknown" ? ` (IP ${params.ipAddress})` : "";
    await notificarUsuarios(params.tenantId, [params.usuarioId], {
      tipo: "WARNING",
      titulo: "Inicio de sesión desde un dispositivo nuevo",
      mensaje: `Se inició sesión en tu cuenta desde ${donde}${ip} el ${fechaHora(params.ahora ?? new Date())}. Si no fuiste vos, cambiá tu contraseña y avisale a un administrador.`,
      accionUrl: "/configuracion",
      entidadTipo: ENTIDAD_SEGURIDAD,
      entidadId: "NUEVO_DISPOSITIVO",
    });
    return true;
  } catch (error) {
    console.error("[seguridad] Aviso de dispositivo nuevo:", error);
    return false;
  }
}

export async function notificarCuentaBloqueada(params: {
  tenantId: bigint;
  username: string;
  intentos: number;
}): Promise<void> {
  await notificarAdministradores(params.tenantId, {
    tipo: "ERROR",
    titulo: "Cuenta bloqueada por intentos fallidos",
    mensaje: `La cuenta "${params.username}" se bloqueó tras ${params.intentos} intentos fallidos de inicio de sesión. Podés desbloquearla desde Empleados.`,
    accionUrl: "/empleados",
    entidadTipo: ENTIDAD_SEGURIDAD,
    entidadId: "CUENTA_BLOQUEADA",
  });
}

export async function notificarPasswordCambiadaPorAdmin(params: {
  tenantId: bigint;
  usuarioAfectadoId: bigint;
  /** Nombre de quien la cambió (admin o SuperAdmin). */
  cambiadaPor: string;
}): Promise<void> {
  await notificarUsuarios(params.tenantId, [params.usuarioAfectadoId], {
    tipo: "WARNING",
    titulo: "Tu contraseña fue cambiada",
    mensaje: `${params.cambiadaPor} cambió la contraseña de tu cuenta. Si no lo esperabas, avisale a un administrador.`,
    entidadTipo: ENTIDAD_SEGURIDAD,
    entidadId: "PASSWORD_CAMBIADA",
  });
}

export async function notificarCambio2FA(params: {
  tenantId: bigint;
  usuarioId: bigint;
  username: string;
  activado: boolean;
}): Promise<void> {
  const datos = params.activado
    ? {
        tipo: "SUCCESS" as const,
        titulo: "Verificación en dos pasos activada",
        mensaje: "Activaste la verificación en dos pasos. A partir de ahora vas a necesitar el código de tu app para iniciar sesión.",
      }
    : {
        tipo: "WARNING" as const,
        titulo: "Verificación en dos pasos desactivada",
        mensaje: "Se desactivó la verificación en dos pasos de tu cuenta. Si no fuiste vos, cambiá tu contraseña y avisale a un administrador.",
      };
  await notificarUsuarios(params.tenantId, [params.usuarioId], {
    ...datos,
    accionUrl: "/configuracion",
    entidadTipo: ENTIDAD_SEGURIDAD,
    entidadId: params.activado ? "2FA_ACTIVADO" : "2FA_DESACTIVADO",
  });

  // Desactivar el 2FA baja la seguridad: también se avisa a los administradores.
  if (!params.activado) {
    await notificarAdministradores(
      params.tenantId,
      {
        tipo: "WARNING",
        titulo: "Un usuario desactivó la verificación en dos pasos",
        mensaje: `"${params.username}" desactivó la verificación en dos pasos de su cuenta.`,
        accionUrl: "/empleados",
        entidadTipo: ENTIDAD_SEGURIDAD,
        entidadId: "2FA_DESACTIVADO",
      },
      { excluir: [params.usuarioId] },
    );
  }
}
