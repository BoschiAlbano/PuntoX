"use client";
import React, { useEffect } from "react";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { usePagePermission } from "@/lib/permissions/usePagePermission";

export default function Page() {
  const { tieneAcceso, isLoading: isLoadingPermisos } = usePagePermission(); // Proteger página con permisos (aunque /test no está en el mapeo, esto redirige si no está autenticado)
  
  // TODOS LOS HOOKS DEBEN IR ANTES DE LOS EARLY RETURNS
  const supabase = getSupabaseBrowserClient();
  const { user, session } = useSupabaseAuthContext();
  const roleFromMetadata =
    typeof user?.app_metadata?.role === "string"
      ? user.app_metadata.role
      : null;
  const tenantFromMetadata = user?.app_metadata?.tenant_id as
    | string
    | number
    | null
    | undefined;

  // En tu componente React/Next.js o similar
  useEffect(() => {
    async function getArticulos() {
      // Aquí asumo que 'supabase' es tu cliente ya inicializado y autenticado
      const { data: Articulo, error } = await supabase
        .from("Articulo")
        .select("*");

      if (error) {
        console.error("Error al obtener artículos:", error);
      } else {
        console.log("Artículos recibidos:", Articulo);
      }
    }

    getArticulos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // EARLY RETURNS DESPUÉS DE TODOS LOS HOOKS
  // No renderizar contenido hasta que los permisos estén verificados
  if (isLoadingPermisos) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si tieneAcceso es undefined, aún está cargando
  if (tieneAcceso === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no tiene acceso, no renderizar nada (usePagePermission ya redirige)
  if (tieneAcceso === false) {
    return null;
  }

  return (
    <div>
      <h1>Session user id: {session?.user?.id}</h1>
      <h1>Email: {user?.email}</h1>
      <h1>Role: {user?.role || roleFromMetadata}</h1>
      <h1>TenantId: {user?.tenantId ?? tenantFromMetadata}</h1>

      {/* user y session */}
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
