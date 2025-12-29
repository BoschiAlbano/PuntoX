import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

/**
 * Obtiene el usuario autenticado y su tenantId desde Supabase app_metadata
 * Soporta tanto tenantId (camelCase) como tenant_id (snake_case)
 * @returns Objeto con user, tenantId y una función errorResponse si no está autenticado
 */
export async function getAuthUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Si hay error al obtener el usuario o no hay usuario
  if (authError || !user) {
    console.error("[getAuthUser] Error al obtener usuario:", authError?.message || "Usuario no encontrado");
    return {
      user: null,
      tenantId: null,
      error: NextResponse.json({ message: "No autenticado" }, { status: 401 }),
    };
  }

  // Obtener tenantId de app_metadata (busca primero tenant_id, luego tenantId como fallback)
  const tenantId = user?.app_metadata?.tenant_id || user?.app_metadata?.tenantId;

  // Si no hay tenantId, retornamos un objeto con error
  if (!tenantId) {
    console.error("[getAuthUser] Usuario sin tenantId en app_metadata:", {
      userId: user.id,
      email: user.email,
      app_metadata: user.app_metadata,
    });
    return {
      user: null,
      tenantId: null,
      error: NextResponse.json({ 
        message: "Usuario sin tenantId configurado",
        details: "El usuario no tiene un tenantId asociado en app_metadata"
      }, { status: 401 }),
    };
  }

  return {
    user,
    tenantId: Number(tenantId),
    error: null,
  };
}
