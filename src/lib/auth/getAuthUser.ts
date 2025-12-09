import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

/**
 * Obtiene el usuario autenticado y su tenantId desde Supabase
 * @returns Objeto con user, tenantId y una función errorResponse si no está autenticado
 */
export async function getAuthUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tenantId = user?.user_metadata?.tenantId;

  // Si no hay tenantId, retornamos un objeto con error
  if (!tenantId) {
    return {
      user: null,
      tenantId: null,
      error: NextResponse.json({ message: "No autenticado" }, { status: 401 }),
    };
  }

  return {
    user,
    tenantId: Number(tenantId),
    error: null,
  };
}
