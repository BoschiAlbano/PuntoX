import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

/**
 * GET /api/auth/trusted-device/verify
 * Verifica si el usuario actual tiene una cookie de dispositivo confiable válida
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isTrusted: false });
    }

    const tenantId = user.app_metadata?.tenantId;
    if (!tenantId) {
      return NextResponse.json({ isTrusted: false });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("trusted_device_token")?.value;

    if (!token) {
      return NextResponse.json({ isTrusted: false });
    }

    // Buscar en la BD si existe este dispositivo confiable para este usuario
    const dispositivo = await prisma.$queryRawUnsafe<Array<{ Id: bigint }>>(
      `
      SELECT "Id" FROM "DispositivoConfiable"
      WHERE "TenantId" = $1
        AND "Token" = $2
        AND "EstaActivo" = true
      LIMIT 1
    `,
      BigInt(tenantId),
      token
    );

    if (dispositivo && dispositivo.length > 0) {
      // Opcional: Actualizar FechaUltimoUso aquí, aunque no es estrictamente necesario en cada GET
      return NextResponse.json({ isTrusted: true });
    }

    // Si el token existe pero no está en la BD (fue revocado), limpiamos la cookie
    const response = NextResponse.json({ isTrusted: false });
    response.cookies.delete("trusted_device_token");
    return response;

  } catch (error) {
    console.error("Error verificando dispositivo confiable:", error);
    return NextResponse.json({ isTrusted: false });
  }
}
