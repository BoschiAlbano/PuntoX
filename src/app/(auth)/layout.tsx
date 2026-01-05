"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/components/loading/loading";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { status } = useSupabaseAuthContext();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Solo redirigir si estamos autenticados y no estamos ya en proceso de redirección
    if (status === "authenticated" && !isRedirecting) {
      setIsRedirecting(true);
      // Obtener permisos y redirigir a la primera página disponible
      fetch("/api/permisos", { cache: "no-store" })
        .then((res) => {
          // Si la respuesta es 401, no redirigir (el interceptor se encargará)
          if (res.status === 401) {
            setIsRedirecting(false);
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return; // Si data es null, ya manejamos el error arriba
          
          const permisos = Array.isArray(data.permisos) ? data.permisos : [];
          const isSuperAdmin = data.isSuperAdmin === true;

          // Si es SuperAdmin o tiene permisos, redirigir a la primera página disponible
          if (isSuperAdmin) {
            router.push("/ventas");
            return;
          }

          // Buscar la primera página a la que tenga acceso
          const rutasDisponibles = [
            "/ventas",
            "/caja",
            "/clientes",
            "/productos",
            "/analiticas",
            "/configuracion",
            "/empleados",
          ];

          // Normalizar permisos para comparar
          const normalizePermiso = (p: string) =>
            p.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

          const permisosNormalizados = permisos.map(normalizePermiso);

          const primeraRutaDisponible = rutasDisponibles.find((ruta) => {
            const permisoRequerido = ruta.replace("/", "");
            return permisosNormalizados.includes(normalizePermiso(permisoRequerido));
          });

          if (primeraRutaDisponible) {
            router.push(primeraRutaDisponible);
          } else {
            // Si no tiene acceso a ninguna página, redirigir a empleados (donde puede gestionar permisos)
            router.push("/empleados");
          }
        })
        .catch((error) => {
          console.error("Error obteniendo permisos:", error);
          setIsRedirecting(false);
          // No redirigir en caso de error si es 401 (sesión cerrada)
          if (error?.status !== 401) {
            router.push("/empleados");
          }
        });
    }
  }, [status, router, isRedirecting]);

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "authenticated" && isRedirecting) {
    return <Loading />;
  }

  if (status === "authenticated" && !isRedirecting) {
    return null;
  }

  return <div>{children}</div>;
}
