import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

/**
 * DELETE /api/auth/trusted-device
 * Revoca todos los dispositivos confiables del usuario autenticado:
 * - Pone EstaActivo = false en todos sus registros de DispositivoConfiable.
 * - Borra la cookie trusted_device_token (HttpOnly, solo modificable server-side).
 *
 * Se llama cuando el usuario desactiva su 2FA para que los tokens
 * anteriores no persistan y no se acumulen registros al reactivarlo.
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Soportar tanto "tenantId" (camelCase) como "tenant_id" (snake_case)
    const tenantId =
      user.app_metadata?.tenantId || user.app_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json(
        { error: "No se pudo determinar el tenant" },
        { status: 400 },
      );
    }

    // Buscar el UsuarioId en la BD
    const usuarioRows = await prisma.$queryRawUnsafe<Array<{ Id: bigint }>>(
      `SELECT "Id" FROM "Usuario" WHERE "AuthUserId" = $1 AND "TenantId" = $2 LIMIT 1`,
      user.id,
      BigInt(tenantId),
    );

    if (!usuarioRows || usuarioRows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const usuarioId = usuarioRows[0].Id;

    // Revocar todos los dispositivos confiables del usuario en este tenant
    const revocados = await prisma.$executeRawUnsafe(
      `
      UPDATE "DispositivoConfiable"
      SET "EstaActivo" = false
      WHERE "UsuarioId" = $1
        AND "TenantId" = $2
        AND "EstaActivo" = true
      `,
      usuarioId,
      BigInt(tenantId),
    );

    // Borrar la cookie HttpOnly desde el servidor
    const cookieStore = await cookies();
    const response = NextResponse.json(
      {
        message: "Dispositivos confiables revocados correctamente",
        revocados,
      },
      { status: 200 },
    );
    response.cookies.delete("trusted_device_token");

    return response;
  } catch (error) {
    console.error("[trusted-device] Error al revocar dispositivos:", error);
    return NextResponse.json(
      { error: "Error al revocar dispositivos confiables" },
      { status: 500 },
    );
  }
}
