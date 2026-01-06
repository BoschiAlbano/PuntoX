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
  // Usar placeholderData para evitar cancelaciones cuando cambia el pathname
  const { data: permisosData, isLoading, error } = useQuery({
    queryKey: ["user-permissions"],
    queryFn: async () => {
      const res = await fetch("/api/permisos", { 
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        // Si es 401, el usuario no está autenticado
        if (res.status === 401) {
          throw new Error("No autenticado");
        }
        // Para otros errores, retornar un objeto por defecto
        console.error("Error al obtener permisos:", res.status, res.statusText);
        return {
          permisos: [],
          isSuperAdmin: false,
          roles: [],
        };
      }
      return res.json();
    },
    enabled: status === "authenticated" && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 10 * 60 * 1000, // 10 minutos en cache (antes cacheTime)
    retry: 1,
    retryOnMount: false, // No hacer retry si ya hay datos en cache para navegación más rápida
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    refetchOnMount: false, // No refetch al montar si hay datos frescos
    // Mantener datos anteriores visibles mientras cargan nuevos (mejor UX)
    placeholderData: (previousData) => previousData,
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

    // Si hay un error de autenticación, redirigir a login
    if (error && error.message === "No autenticado") {
      router.push("/signin");
      return;
    }

    // Esperar a que los permisos se carguen (permitir acceso mientras carga si hay datos por defecto)
    if (!permisosData && !error) {
      return;
    }

    // Si no hay datos de permisos (por error), usar valores por defecto
    const permisosUsuario = Array.isArray(permisosData?.permisos) ? permisosData.permisos : [];
    const isSuperAdmin = permisosData?.isSuperAdmin === true;

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
  }, [user, status, pathname, router, permisosData, isLoading, error]);

  const permisos = Array.isArray(permisosData?.permisos) ? permisosData.permisos : [];
  
  // Optimización: Si hay datos en cache aunque isLoading sea true, usarlos para no bloquear la UI
  // Esto permite que las páginas se rendericen inmediatamente si ya tenemos permisos en cache
  const tieneAcceso = !permisosData && isLoading
    ? undefined // Solo undefined si realmente no hay datos y está cargando
    : (
        permisosData?.isSuperAdmin === true || 
        !getPermisoForRoute(pathname) || 
        tienePermisoParaRuta(permisos, pathname)
      );

  // isLoading solo debe ser true si realmente no hay datos en cache
  const isLoadingReal = isLoading && !permisosData;

  return { tieneAcceso, permisos, isLoading: isLoadingReal };
}

