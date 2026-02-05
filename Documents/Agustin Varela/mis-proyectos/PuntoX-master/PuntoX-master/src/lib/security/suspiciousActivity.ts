import prisma from "@/DB/prisma";

export type TipoAlerta =
  | "LOGIN_SOSPECHOSO"
  | "NUEVO_DISPOSITIVO"
  | "MULTIPLE_IP"
  | "INTENTOS_FALLIDOS"
  | "IP_BLOQUEADA"
  | "ACTIVIDAD_INUSUAL";

export type SeveridadAlerta = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

interface CrearAlertaParams {
  tenantId: bigint;
  tipo: TipoAlerta;
  severidad: SeveridadAlerta;
  mensaje: string;
  detalles?: Record<string, unknown>;
  usuarioId?: bigint;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Crea una alerta de seguridad
 */
export async function crearAlertaSeguridad(
  params: CrearAlertaParams
): Promise<void> {
  const detallesJson = params.detalles
    ? JSON.stringify(params.detalles)
    : null;

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "AlertaSeguridad" (
      "TenantId", "UsuarioId", "Tipo", "Severidad", "Mensaje", 
      "Detalles", "IpAddress", "UserAgent", "FechaCreacion", "EstaResuelta"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), false)
    `,
    params.tenantId,
    params.usuarioId || null,
    params.tipo,
    params.severidad,
    params.mensaje,
    detallesJson,
    params.ipAddress || null,
    params.userAgent || null
  );
}

/**
 * Detecta si hay actividad sospechosa para un usuario
 */
export async function detectarActividadSospechosa(
  tenantId: bigint,
  usuarioId: bigint,
  ipAddress: string,
  userAgent: string
): Promise<{
  esSospechosa: boolean;
  razones: string[];
}> {
  const razones: string[] = [];

  // Verificar si es un dispositivo nuevo
  const dispositivoConocido = await prisma.$queryRawUnsafe<Array<{
    Id: bigint;
  }>>(
    `
    SELECT "Id"
    FROM "DispositivoConfiable"
    WHERE "TenantId" = $1
      AND "UsuarioId" = $2
      AND "UserAgent" = $3
      AND "EstaActivo" = true
    LIMIT 1
    `,
    tenantId,
    usuarioId,
    userAgent
  );

  if (dispositivoConocido.length === 0) {
    razones.push("NUEVO_DISPOSITIVO");
  }

  // Verificar múltiples IPs en un corto período
  const ipsRecientes = await prisma.$queryRawUnsafe<Array<{
    IpAddress: string;
    count: bigint;
  }>>(
    `
    SELECT "IpAddress", COUNT(DISTINCT "IpAddress") as count
    FROM "SesionActiva"
    WHERE "TenantId" = $1
      AND "UsuarioId" = $2
      AND "EstaActiva" = true
      AND "FechaUltimaActividad" > NOW() - INTERVAL '1 hour'
    GROUP BY "IpAddress"
    HAVING COUNT(DISTINCT "IpAddress") > 2
    `,
    tenantId,
    usuarioId
  );

  if (ipsRecientes.length > 0) {
    razones.push("MULTIPLE_IP");
  }

  // Verificar intentos fallidos recientes
  const intentosFallidos = await prisma.$queryRawUnsafe<Array<{
    count: bigint;
  }>>(
    `
    SELECT COUNT(*) as count
    FROM "IntentoLogin"
    WHERE "TenantId" = $1
      AND "UsuarioId" = $2
      AND "Exitoso" = false
      AND "FechaIntento" > NOW() - INTERVAL '15 minutes'
    `,
    tenantId,
    usuarioId
  );

  const fallidos = Number(intentosFallidos[0]?.count || 0);
  if (fallidos >= 3) {
    razones.push("INTENTOS_FALLIDOS");
  }

  return {
    esSospechosa: razones.length > 0,
    razones,
  };
}

