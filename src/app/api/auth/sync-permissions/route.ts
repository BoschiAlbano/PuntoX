import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { actualizarPermisosEnJWT } from "@/lib/auth/updateUserPermissions";

/**
 * Endpoint para sincronizar permisos del usuario en el JWT
 * Se llama automáticamente después del login o cuando se detecta que faltan permisos
 */
export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Actualizar permisos en JWT
    await actualizarPermisosEnJWT(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sincronizando permisos:", error);
    return NextResponse.json(
      { error: "Error al sincronizar permisos" },
      { status: 500 }
    );
  }
}

