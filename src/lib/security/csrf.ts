import crypto from "crypto";
import prisma from "@/DB/prisma";

const CSRF_TOKEN_EXPIRY_MINUTES = 30;

/**
 * Genera un token CSRF y lo guarda en la base de datos
 */
export async function generateCsrfToken(
  tenantId: bigint,
  usuarioId?: bigint,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const fechaExpiracion = new Date();
  fechaExpiracion.setMinutes(
    fechaExpiracion.getMinutes() + CSRF_TOKEN_EXPIRY_MINUTES
  );

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "TokenCsrf" ("TenantId", "UsuarioId", "Token", "FechaCreacion", "FechaExpiracion", "Usado", "IpAddress", "UserAgent")
    VALUES ($1, $2, $3, NOW(), $4, false, $5, $6)
    `,
    tenantId,
    usuarioId || null,
    token,
    fechaExpiracion,
    ipAddress || null,
    userAgent || null
  );

  return token;
}

/**
 * Valida un token CSRF
 */
export async function validateCsrfToken(
  token: string,
  tenantId: bigint,
  ipAddress?: string
): Promise<boolean> {
  const result = await prisma.$queryRawUnsafe<Array<{
    Usado: boolean;
    FechaExpiracion: Date;
    IpAddress: string | null;
  }>>(
    `
    SELECT "Usado", "FechaExpiracion", "IpAddress"
    FROM "TokenCsrf"
    WHERE "Token" = $1
      AND "TenantId" = $2
    LIMIT 1
    `,
    token,
    tenantId
  );

  if (result.length === 0) {
    return false;
  }

  const tokenData = result[0];

  // Verificar expiración
  if (new Date() > tokenData.FechaExpiracion) {
    return false;
  }

  // Verificar si ya fue usado
  if (tokenData.Usado) {
    return false;
  }

  // Opcional: verificar IP (puede ser estricto o flexible según necesidad)
  // if (ipAddress && tokenData.IpAddress && tokenData.IpAddress !== ipAddress) {
  //   return false;
  // }

  // Marcar como usado
  await prisma.$executeRawUnsafe(
    `
    UPDATE "TokenCsrf"
    SET "Usado" = true
    WHERE "Token" = $1
    `,
    token
  );

  return true;
}

/**
 * Limpia tokens CSRF expirados (ejecutar periódicamente)
 */
export async function cleanupExpiredCsrfTokens(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `
    DELETE FROM "TokenCsrf"
    WHERE "FechaExpiracion" < NOW()
    `
  );
}

