"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { getPermisoForRoute } from "./routePermissions";

/**
 * Hook para verificar permisos de acceso a una página
 * Redirige automáticamente si el usuario no tiene permiso
 */
export function usePagePermission() {
  const { user, status } = useSupabaseAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [permisos, setPermisos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tieneAcceso, setTieneAcceso] = useState(false);

  useEffect(() => {
    async function verificarPermisos() {
      if (status === "loading") {
        return;
      }

      if (status === "unauthenticated" || !user) {
        router.push("/signin");
        return;
      }

      try {
        const res = await fetch("/api/permisos", {
          cache: "no-store",
        });

        if (!res.ok) {
          // Si no puede obtener permisos, redirigir al login
          router.push("/signin");
          return;
        }

        const data = await res.json();
        const permisosUsuario = Array.isArray(data.permisos) ? data.permisos : [];
        const isSuperAdmin = data.isSuperAdmin === true;

        setPermisos(permisosUsuario);

        // SuperAdmin tiene acceso a todo
        if (isSuperAdmin) {
          setTieneAcceso(true);
          setIsLoading(false);
          return;
        }

        // Verificar permiso para la ruta actual
        const permisoRequerido = getPermisoForRoute(pathname);

        if (!permisoRequerido) {
          // Si no hay permiso requerido para esta ruta, permitir acceso
          setTieneAcceso(true);
          setIsLoading(false);
          return;
        }

        // Verificar si tiene el permiso específico usando el helper
        const { tienePermisoParaRuta } = await import("./routePermissions");
        const tienePermiso = tienePermisoParaRuta(permisosUsuario, pathname);

        if (!tienePermiso) {
          // No tiene permiso, buscar la primera página a la que tenga acceso
          const rutasDisponibles = ["/ventas", "/caja", "/clientes", "/productos", "/analiticas", "/configuracion", "/empleados"];
          const primeraRutaDisponible = rutasDisponibles.find((ruta) => 
            tienePermisoParaRuta(permisosUsuario, ruta)
          );
          
          if (primeraRutaDisponible) {
            router.push(primeraRutaDisponible);
          } else {
            // Si no tiene acceso a ninguna página, redirigir a empleados (donde puede gestionar permisos)
            // No redirigir a signin porque el usuario está autenticado
            router.push("/empleados");
          }
          return;
        }

        setTieneAcceso(true);
      } catch (error) {
        console.error("Error verificando permisos:", error);
        router.push("/signin");
      } finally {
        setIsLoading(false);
      }
    }

    verificarPermisos();
  }, [user, status, pathname, router]);

  return { tieneAcceso, permisos, isLoading };
}

