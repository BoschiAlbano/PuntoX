import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  calcularPermisosUsuario,
  actualizarPermisosEnJWT,
} from "@/lib/auth/updateUserPermissions";
import { handleError } from "@/lib/errors/handler";

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
    const isAdministradorJWT = metadata.isAdministrador === true;
    const rolesJWT =
      (metadata.roles as Array<{ id: number; nombre: string; tipo: string }>) ||
      [];

    // Si es SuperAdmin en JWT, retornar inmediatamente (sin verificar permisos)
    if (isSuperAdminJWT) {
      return NextResponse.json({
        permisos: [], // SuperAdmin no necesita permisos específicos
        isSuperAdmin: true,
        isAdministrador: false,
        roles: rolesJWT,
      });
    }

    // Si es Administrador en JWT, retornar inmediatamente
    if (isAdministradorJWT) {
      return NextResponse.json({
        permisos: [],
        isSuperAdmin: false,
        isAdministrador: true,
        roles: rolesJWT,
      });
    }

    // Para usuarios normales, siempre calcular desde DB para asegurar permisos actualizados
    // Esto es especialmente importante después de crear un tenant o asignar nuevos permisos
    const { permisos, isSuperAdmin, isAdministrador, roles } =
      await calcularPermisosUsuario(user.id);

    // Si es SuperAdmin desde DB pero no en JWT, actualizar JWT inmediatamente
    if (isSuperAdmin && !isSuperAdminJWT) {
      actualizarPermisosEnJWT(user.id).catch(() => {
        // Error no crítico, continuar
      });
      return NextResponse.json({
        permisos: [], // SuperAdmin no necesita permisos específicos
        isSuperAdmin: true,
        isAdministrador: false,
        roles,
      });
    }

    // Si es Administrador desde DB pero no en JWT, actualizar JWT inmediatamente
    if (isAdministrador && !isAdministradorJWT) {
      actualizarPermisosEnJWT(user.id).catch(() => {
        // Error no crítico, continuar
      });
      return NextResponse.json({
        permisos: [],
        isSuperAdmin: false,
        isAdministrador: true,
        roles,
      });
    }

    // Comparar permisos del JWT con los de la DB
    // Si son diferentes, actualizar JWT en background
    const permisosJWTSet = new Set(permisosJWT);
    const permisosDBSet = new Set(permisos);
    const permisosDiferentes =
      permisosJWT.length !== permisos.length ||
      !permisosJWT.every((p) => permisosDBSet.has(p)) ||
      !permisos.every((p) => permisosJWTSet.has(p));

    if (permisosDiferentes) {
      // Los permisos en JWT no coinciden con los de DB, actualizar JWT
      actualizarPermisosEnJWT(user.id).catch(() => {
        // Error no crítico, continuar
      });
    }

    // Retornar permisos desde DB (siempre actualizados)
    return NextResponse.json({
      permisos,
      isSuperAdmin: false,
      isAdministrador: false,
      roles,
    });
  } catch (error) {
    return handleError(error);
  }
}
