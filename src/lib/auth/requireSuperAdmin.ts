import { NextResponse } from "next/server";
import { getAuthContext, type AuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";

/**
 * Para rutas de /api/admin: exige sesión de superadmin.
 *
 * Devuelve el contexto (tenantId sale de app_metadata, que solo el servidor
 * puede escribir) o la respuesta de error lista para devolver:
 *
 *   const auth = await requireSuperAdmin();
 *   if (auth instanceof NextResponse) return auth;
 *
 * Nunca usar user_metadata para el tenant: el propio usuario puede
 * modificarlo desde el navegador (supabase.auth.updateUser).
 */
export async function requireSuperAdmin(): Promise<AuthContext | NextResponse> {
  try {
    const ctx = await getAuthContext();
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return ctx;
  } catch (error) {
    return handleError(error);
  }
}
