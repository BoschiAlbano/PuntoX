"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { getPermisoForRoute, tienePermisoParaRuta } from "./routePermissions";

/**
 * Hook para verificar permisos de acceso a una página
 * Usa React Query para cachear permisos y evitar queries repetidas
 * Redirige automáticamente si el usuario no tiene permiso
 */
export function usePagePermission() {
  const { user, status } = useSupabaseAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  // Usar React Query para cachear permisos (se cachea por 5 minutos)
  const { data: permisosData, isLoading } = useQuery({
    queryKey: ["user-permissions"],
    queryFn: async () => {
      const res = await fetch("/api/permisos", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Error al obtener permisos");
      }
      return res.json();
    },
    enabled: status === "authenticated" && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    retry: 1,
  });

  useEffect(() => {
    // No hacer nada mientras está cargando
    if (status === "loading" || isLoading) {
      return;
    }

    // Redirigir a login si no está autenticado
    if (status === "unauthenticated" || !user) {
      router.push("/signin");
      return;
    }

    // Esperar a que los permisos se carguen
    if (!permisosData) {
      return;
    }

    const permisosUsuario = Array.isArray(permisosData.permisos) ? permisosData.permisos : [];
    const isSuperAdmin = permisosData.isSuperAdmin === true;

    // SuperAdmin tiene acceso a TODO - no redirigir nunca
    if (isSuperAdmin) {
      return; // Salir temprano, no hacer ninguna verificación adicional
    }

    // Verificar permiso para la ruta actual
    const permisoRequerido = getPermisoForRoute(pathname);

    // Si no hay permiso requerido para esta ruta, permitir acceso
    if (!permisoRequerido) {
      return;
    }

    // Verificar si tiene el permiso específico
    const tienePermiso = tienePermisoParaRuta(permisosUsuario, pathname);

    // Solo redirigir si NO tiene permiso y NO es SuperAdmin
    if (!tienePermiso) {
      // No tiene permiso, buscar la primera página a la que tenga acceso
      const rutasDisponibles = ["/ventas", "/caja", "/clientes", "/productos", "/analiticas", "/configuracion", "/empleados"];
      const primeraRutaDisponible = rutasDisponibles.find((ruta) => 
        tienePermisoParaRuta(permisosUsuario, ruta)
      );
      
      if (primeraRutaDisponible) {
        router.push(primeraRutaDisponible);
      } else {
        // Si no tiene acceso a ninguna página, redirigir a empleados
        router.push("/empleados");
      }
    }
  }, [user, status, pathname, router, permisosData, isLoading]);

  const permisos = Array.isArray(permisosData?.permisos) ? permisosData.permisos : [];
  const tieneAcceso = permisosData ? (
    permisosData.isSuperAdmin === true || 
    !getPermisoForRoute(pathname) || 
    tienePermisoParaRuta(permisos, pathname)
  ) : false;

  return { tieneAcceso, permisos, isLoading };
}

