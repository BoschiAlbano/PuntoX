"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/components/loading/loading";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { status } = useSupabaseAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Si el usuario está en /signin explícitamente, permitir que vea el login
    // Esto permite cerrar sesión o iniciar con otra cuenta
    if (pathname === "/signin" && status === "authenticated") {
      return; // No redirigir, mostrar el login
    }

    // Solo redirigir si estamos autenticados y no estamos ya en proceso de redirección
    if (status === "authenticated" && !isRedirecting) {
      setIsRedirecting(true);
      
      // PRIMERO verificar sucursales ANTES de determinar el destino
      // Esto previene el "pantallazo" de /ventas antes de seleccionar sucursal
      fetch("/api/sucursales/mis-sucursales", { cache: "no-store" })
        .then((res) => {
          if (res.status === 401) {
            setIsRedirecting(false);
            return null;
          }
          if (!res.ok) {
            // Si hay error obteniendo sucursales, ir a seleccionar
            window.location.href = "/seleccionar-sucursal";
            return null;
          }
          return res.json();
        })
        .then(async (dataSucursales) => {
          if (!dataSucursales) return; // Ya manejamos el error arriba
          
          const tieneSucursales = dataSucursales.sucursales && dataSucursales.sucursales.length > 0;
          const tieneMultiples = dataSucursales.tieneMultiplesSucursales || 
            (dataSucursales.sucursales && dataSucursales.sucursales.length > 1);
          const tieneSucursalActiva = !!dataSucursales.sucursalActiva;

          console.log("[Auth Layout] Verificación de sucursales:", {
            tieneSucursales,
            tieneMultiples,
            tieneSucursalActiva,
            cantidad: dataSucursales.sucursales?.length || 0,
          });

          // Si tiene múltiples sucursales, SIEMPRE ir a seleccionar
          if (tieneMultiples) {
            console.log("[Auth Layout] Tiene múltiples sucursales - redirigiendo a /seleccionar-sucursal");
            window.location.href = "/seleccionar-sucursal";
            return;
          }

          // Si no tiene sucursales, ir a seleccionar (mostrará mensaje de error)
          if (!tieneSucursales) {
            console.log("[Auth Layout] Sin sucursales - redirigiendo a /seleccionar-sucursal");
            window.location.href = "/seleccionar-sucursal";
            return;
          }

          // Si solo tiene 1 sucursal y no está activa, autoseleccionarla
          if (tieneSucursales && !tieneMultiples && !tieneSucursalActiva) {
            console.log("[Auth Layout] Autoseleccionando única sucursal");
            const resCambio = await fetch("/api/sucursales/cambiar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sucursalId: dataSucursales.sucursales[0].id }),
            });
            if (!resCambio.ok) {
              // Si falla la autoselección, ir a seleccionar
              window.location.href = "/seleccionar-sucursal";
              return;
            }
            // Continuar con el flujo solo si la autoselección fue exitosa
          }

          // Solo llegar aquí si tiene sucursal activa (ya sea porque tenía o porque autoseleccionó)
          // Ahora determinar destino según permisos
          return fetch("/api/permisos", { cache: "no-store" });
        })
        .then(async (resPermisos) => {
          if (!resPermisos) return; // Ya redirigimos arriba
          
          // Si la respuesta es 401, no redirigir (el interceptor se encargará)
          if (resPermisos.status === 401) {
            setIsRedirecting(false);
            return null;
          }
          return resPermisos.json();
        })
        .then(async (dataPermisos) => {
          if (!dataPermisos) return; // Ya manejamos el error arriba
          
          const permisos = Array.isArray(dataPermisos.permisos) ? dataPermisos.permisos : [];
          const isSuperAdmin = dataPermisos.isSuperAdmin === true;

          let destino = "/empleados";
          
          if (isSuperAdmin) {
            destino = "/ventas";
          } else {
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

            const normalizePermiso = (p: string) =>
              p.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

            const permisosNormalizados = permisos.map(normalizePermiso);

            const primeraRutaDisponible = rutasDisponibles.find((ruta) => {
              const permisoRequerido = ruta.replace("/", "");
              return permisosNormalizados.includes(normalizePermiso(permisoRequerido));
            });

            if (primeraRutaDisponible) {
              destino = primeraRutaDisponible;
            }
          }

          // Redirigir al destino usando window.location para evitar pantallazos
          console.log("[Auth Layout] Redirigiendo a:", destino);
          window.location.href = destino;
        })
        .catch((error) => {
          console.error("[Auth Layout] Error obteniendo permisos o sucursales:", error);
          setIsRedirecting(false);
          // Si hay error, ir a seleccionar sucursal por seguridad
          window.location.href = "/seleccionar-sucursal";
        });
    }
  }, [status, router, isRedirecting, pathname]);

  if (status === "loading") {
    return <Loading />;
  }

  // Si el usuario está en /signin explícitamente, SIEMPRE mostrar el contenido
  // Esto permite ver el login incluso si está autenticado (para cerrar sesión o cambiar de cuenta)
  if (pathname === "/signin") {
    return <div>{children}</div>;
  }

  if (status === "authenticated" && isRedirecting) {
    return <Loading />;
  }

  if (status === "authenticated" && !isRedirecting) {
    return null;
  }

  return <div>{children}</div>;
}
