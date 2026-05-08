import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

/**
 * GET /api/auth/trusted-device/verify
 * Verifica si el usuario actual tiene una cookie de dispositivo confiable válida.
 * La verificación incluye TenantId + UsuarioId + Token para evitar que una cookie
 * de un usuario sea usada por otro usuario del mismo tenant.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isTrusted: false });
    }

    // Soportar tanto "tenantId" (camelCase, usuarios legacy/admin) como "tenant_id" (snake_case, empleados creados vía API)
    const tenantId = user.app_metadata?.tenantId || user.app_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ isTrusted: false });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("trusted_device_token")?.value;

    if (!token) {
      return NextResponse.json({ isTrusted: false });
    }

    // Buscar el UsuarioId en la BD para validar que el token pertenece al usuario actual
    const usuarioRows = await prisma.$queryRawUnsafe<Array<{ Id: bigint }>>(
      `SELECT "Id" FROM "Usuario" WHERE "AuthUserId" = $1 AND "TenantId" = $2 LIMIT 1`,
      user.id,
      BigInt(tenantId),
    );

    if (!usuarioRows || usuarioRows.length === 0) {
      return NextResponse.json({ isTrusted: false });
    }

    const usuarioId = usuarioRows[0].Id;

    // Buscar en la BD: el token debe pertenecer a este usuario Y tenant
    const dispositivo = await prisma.$queryRawUnsafe<Array<{ Id: bigint }>>(
      `
      SELECT "Id" FROM "DispositivoConfiable"
      WHERE "TenantId" = $1
        AND "UsuarioId" = $2
        AND "Token" = $3
        AND "EstaActivo" = true
      LIMIT 1
    `,
      BigInt(tenantId),
      usuarioId,
      token,
    );

    if (dispositivo && dispositivo.length > 0) {
      // Actualizar FechaUltimoUso en background (no bloqueante)
      prisma.$executeRawUnsafe(
        `UPDATE "DispositivoConfiable" SET "FechaUltimoUso" = NOW() WHERE "Token" = $1`,
        token,
      ).catch(() => {});
      return NextResponse.json({ isTrusted: true });
    }

    // Si el token existe en cookie pero no en BD (fue revocado), limpiar la cookie
    const response = NextResponse.json({ isTrusted: false });
    response.cookies.delete("trusted_device_token");
    return response;
  } catch (error) {
    console.error("[trusted-device/verify] Error:", error);
    return NextResponse.json({ isTrusted: false });
  }
}
