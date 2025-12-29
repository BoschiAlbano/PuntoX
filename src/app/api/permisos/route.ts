import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { calcularPermisosUsuario, actualizarPermisosEnJWT } from "@/lib/auth/updateUserPermissions";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Intentar leer permisos del JWT primero (rápido)
    const metadata = user.app_metadata || {};
    const permisosJWT = (metadata.permissions as string[]) || [];
    const isSuperAdminJWT = metadata.isSuperAdmin === true;
    const rolesJWT = (metadata.roles as Array<{ id: number; nombre: string; tipo: string }>) || [];

    // Si es SuperAdmin en JWT, retornar inmediatamente (sin verificar permisos)
    if (isSuperAdminJWT) {
      return NextResponse.json({
        permisos: [], // SuperAdmin no necesita permisos específicos
        isSuperAdmin: true,
        roles: rolesJWT,
      });
    }

    // Si hay permisos en JWT, usarlos (sin consultar DB)
    if (permisosJWT.length > 0 || rolesJWT.length > 0) {
      return NextResponse.json({
        permisos: permisosJWT,
        isSuperAdmin: false,
        roles: rolesJWT,
      });
    }

    // Fallback: Calcular desde DB si no hay en JWT
    // Esto actualiza el JWT para futuras requests
    const { permisos, isSuperAdmin, roles } = await calcularPermisosUsuario(user.id);

    // Si es SuperAdmin desde DB, actualizar JWT inmediatamente
    if (isSuperAdmin) {
      actualizarPermisosEnJWT(user.id).catch((err) => {
        console.warn("No se pudo actualizar permisos en JWT:", err);
      });
      return NextResponse.json({
        permisos: [], // SuperAdmin no necesita permisos específicos
        isSuperAdmin: true,
        roles,
      });
    }

    // Actualizar JWT en background para usuarios normales (no bloqueamos la respuesta)
    actualizarPermisosEnJWT(user.id).catch((err) => {
      console.warn("No se pudo actualizar permisos en JWT:", err);
    });

    return NextResponse.json({
      permisos,
      isSuperAdmin: false,
      roles,
    });
  } catch (error) {
    console.error("Error en GET /api/permisos:", error);
    return NextResponse.json(
      { error: "Error al obtener permisos" },
      { status: 500 }
    );
  }
}
