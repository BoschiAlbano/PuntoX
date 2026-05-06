/**
 * Helper para registrar auditorías de acciones sobre empleados/usuarios
 */
import prisma from "@/DB/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

type AccionAuditoria =
  | "CREAR_USUARIO"
  | "EDITAR_USUARIO"
  | "INVITAR_USUARIO"
  | "REENVIAR_INVITACION"
  | "ACEPTAR_INVITACION"
  | "CAMBIAR_ROL"
  | "CAMBIAR_PASSWORD"
  | "SUSPENDER_USUARIO"
  | "REACTIVAR_USUARIO"
  | "ELIMINAR_USUARIO"
  | "CREAR_ROL"
  | "EDITAR_ROL"
  | "ELIMINAR_ROL"
  | "CAMBIAR_CONFIG_SEGURIDAD"
  | "BLOQUEO_AUTOMATICO";

type SeveridadAuditoria = "INFO" | "WARNING" | "CRITICAL";

interface RegistrarAuditoriaParams {
  tenantId: number | bigint;
  usuarioId: number | bigint; // Usuario que realizó la acción
  accion: AccionAuditoria;
  severidad?: SeveridadAuditoria; // Si no se especifica, se infiere automáticamente
  empleadoId?: number | bigint | null; // Empleado afectado (opcional)
  usuarioAfectadoId?: number | bigint | null; // Usuario afectado (opcional)
  detalle?: string;
  valorAnterior?: Record<string, unknown> | null;
  valorNuevo?: Record<string, unknown> | null;
  req?: NextRequest; // Opcional: request para obtener headers en API routes
}

/**
 * Infiere la severidad basándose en la acción
 */
function inferirSeveridad(accion: AccionAuditoria): SeveridadAuditoria {
  // CRITICAL: Eliminaciones definitivas
  if (accion === "ELIMINAR_USUARIO" || accion === "ELIMINAR_ROL") {
    return "CRITICAL";
  }

  // WARNING: Cambios importantes o suspensiones
  if (
    accion === "CAMBIAR_ROL" ||
    accion === "EDITAR_ROL" ||
    accion === "SUSPENDER_USUARIO" ||
    accion === "BLOQUEO_AUTOMATICO" ||
    accion === "CAMBIAR_CONFIG_SEGURIDAD"
  ) {
    return "WARNING";
  }

  // INFO: Creaciones, invitaciones, reactivaciones
  return "INFO";
}

/**
 * Registra una auditoría de acción sobre empleados/usuarios
 */
export async function registrarAuditoria(
  params: RegistrarAuditoriaParams,
): Promise<void> {
  try {
    // Obtener IP y User-Agent de los headers
    let ipAddress = "unknown";
    let userAgent: string | null = null;

    if (params.req) {
      // Si tenemos el request (API route), usar sus headers
      ipAddress =
        params.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        params.req.headers.get("x-real-ip") ||
        "unknown";
      userAgent = params.req.headers.get("user-agent") || null;
    } else {
      // Si no hay request (Server Action), intentar usar headers() de Next.js
      try {
        const headersList = await headers();
        ipAddress =
          headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          headersList.get("x-real-ip") ||
          "unknown";
        userAgent = headersList.get("user-agent") || null;
      } catch (e) {
        // Si headers() no está disponible, usar valores por defecto
        console.warn("[auditoria] No se pudieron obtener headers:", e);
      }
    }

    const severidad = params.severidad || inferirSeveridad(params.accion);

    await prisma.auditoriaEmpleado.create({
      data: {
        TenantId: BigInt(params.tenantId),
        UsuarioId: BigInt(params.usuarioId),
        Accion: params.accion,
        Severidad: severidad,
        EmpleadoId: params.empleadoId ? BigInt(params.empleadoId) : null,
        UsuarioAfectadoId: params.usuarioAfectadoId
          ? BigInt(params.usuarioAfectadoId)
          : null,
        Detalle: params.detalle || null,
        ValorAnterior: params.valorAnterior
          ? JSON.stringify(params.valorAnterior)
          : null,
        ValorNuevo: params.valorNuevo
          ? JSON.stringify(params.valorNuevo)
          : null,
        IpAddress: ipAddress,
        UserAgent: userAgent,
      },
    });
  } catch (error) {
    // No lanzamos error para no interrumpir el flujo principal
    // Solo logueamos el error
    console.error("[auditoria] Error al registrar auditoría:", error);
  }
}
