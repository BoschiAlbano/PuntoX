"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/components/loading/loading";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { status, user } = useSupabaseAuthContext();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && !isRedirecting) {
      setIsRedirecting(true);
      // Obtener permisos y redirigir a la primera página disponible
      fetch("/api/permisos", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
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
          // En caso de error, redirigir a empleados por defecto
          router.push("/empleados");
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
