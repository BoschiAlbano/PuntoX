import prisma from "@/DB/prisma";

interface RateLimitOptions {
  maxAttempts: number;
  windowMinutes: number;
  identifier: string; // email o IP
  tenantId: bigint;
}

/**
 * Verifica si un identificador (email o IP) ha excedido el límite de intentos
 * @returns {Promise<{allowed: boolean, remainingAttempts: number, resetAt: Date}>}
 */
export async function checkRateLimit({
  maxAttempts,
  windowMinutes,
  identifier,
  tenantId,
}: RateLimitOptions): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  resetAt: Date;
}> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

  // Contar intentos fallidos en la ventana de tiempo
  const attempts = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `
    SELECT COUNT(*) as count
    FROM "IntentoLogin"
    WHERE "TenantId" = $1
      AND (
        ("Email" = $2 AND $3 = 'email')
        OR ("IpAddress" = $2 AND $3 = 'ip')
      )
      AND "Exitoso" = false
      AND "FechaIntento" > $4
    `,
    tenantId,
    identifier,
    identifier.includes("@") ? "email" : "ip",
    windowStart
  );

  const attemptCount = Number(attempts[0]?.count || 0);
  const remainingAttempts = Math.max(0, maxAttempts - attemptCount);
  const allowed = attemptCount < maxAttempts;

  // Calcular cuándo se resetea el contador
  const resetAt = new Date();
  resetAt.setMinutes(resetAt.getMinutes() + windowMinutes);

  return {
    allowed,
    remainingAttempts,
    resetAt,
  };
}

/**
 * Verifica si una IP está bloqueada
 */
export async function isIpBlocked(
  ipAddress: string,
  tenantId: bigint
): Promise<boolean> {
  const blocked = await prisma.$queryRawUnsafe<Array<{ EstaActiva: boolean }>>(
    `
    SELECT "EstaActiva"
    FROM "IpBloqueada"
    WHERE "TenantId" = $1
      AND "IpAddress" = $2
      AND "EstaActiva" = true
      AND ("FechaDesbloqueo" IS NULL OR "FechaDesbloqueo" > NOW())
    LIMIT 1
    `,
    tenantId,
    ipAddress
  );

  return blocked.length > 0 && blocked[0].EstaActiva;
}

/**
 * Bloquea una IP temporalmente
 */
export async function blockIp(
  ipAddress: string,
  tenantId: bigint,
  motivo: string,
  minutosBloqueo?: number
): Promise<void> {
  const fechaDesbloqueo = minutosBloqueo
    ? new Date(Date.now() + minutosBloqueo * 60 * 1000)
    : null;

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "IpBloqueada" ("TenantId", "IpAddress", "Motivo", "FechaBloqueo", "FechaDesbloqueo", "EstaActiva", "IntentosFallidos")
    VALUES ($1, $2, $3, NOW(), $4, true, 1)
    ON CONFLICT ("TenantId", "IpAddress")
    DO UPDATE SET
      "EstaActiva" = true,
      "Motivo" = $3,
      "FechaBloqueo" = NOW(),
      "FechaDesbloqueo" = $4,
      "IntentosFallidos" = "IpBloqueada"."IntentosFallidos" + 1
    `,
    tenantId,
    ipAddress,
    motivo,
    fechaDesbloqueo
  );
}

