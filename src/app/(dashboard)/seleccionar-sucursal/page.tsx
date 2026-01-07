"use client";

/**
 * =====================================================
 * PÁGINA DE SELECCIÓN DE SUCURSAL POST-LOGIN
 * =====================================================
 * 
 * Se muestra después del login si el usuario:
 * - Tiene acceso a múltiples sucursales
 * - O no tiene sucursal activa configurada
 * 
 * =====================================================
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Check, Loader2 } from "lucide-react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

type Sucursal = {
  id: number;
  nombre: string;
  direccion: string | null;
  esPrincipal: boolean;
  estaActiva: boolean;
  esDefault: boolean;
};

export default function SeleccionarSucursalPage() {
  const router = useRouter();
  const { status } = useSupabaseAuthContext();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar sucursales del usuario
  useEffect(() => {
    if (status !== "authenticated") {
      router.push("/signin");
      return;
    }

    const cargarSucursales = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/sucursales/mis-sucursales");
        
        if (res.status === 401) {
          router.push("/signin");
          return;
        }

        if (!res.ok) {
          throw new Error("Error al cargar sucursales");
        }

        const data = await res.json();
        const sucursalesList = data.sucursales || [];

        // Si solo tiene 1 sucursal, autoseleccionar
        if (sucursalesList.length === 1) {
          await seleccionarSucursal(sucursalesList[0].id);
          return;
        }

        // Si ya tiene sucursal activa y tiene múltiples, verificar si puede continuar
        if (data.sucursalActiva && sucursalesList.length > 1) {
          // Ya tiene una sucursal activa, puede ir al dashboard
          // Pero mostramos la opción de cambiarla
          setSucursales(sucursalesList);
        } else {
          // Requiere selección obligatoria
          setSucursales(sucursalesList);
        }
      } catch (err) {
        console.error("Error cargando sucursales:", err);
        setError("Error al cargar las sucursales. Por favor, recarga la página.");
      } finally {
        setIsLoading(false);
      }
    };

    cargarSucursales();
  }, [status, router]);

  // Seleccionar sucursal
  const seleccionarSucursal = async (sucursalId: number) => {
    try {
      setIsSelecting(true);
      setError(null);

      const res = await fetch("/api/sucursales/cambiar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sucursalId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al seleccionar sucursal");
      }

      // Marcar en sessionStorage que ya seleccionó sucursal en esta sesión
      sessionStorage.setItem("sucursal_seleccionada", sucursalId.toString());

      // Redirigir al dashboard usando window.location para forzar recarga
      window.location.href = "/ventas";
    } catch (err) {
      console.error("Error seleccionando sucursal:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al seleccionar la sucursal. Intenta nuevamente."
      );
    } finally {
      setIsSelecting(false);
    }
  };

  // Si está cargando
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-slate-600">Cargando sucursales...</p>
        </div>
      </div>
    );
  }

  // Si hay error
  if (error && sucursales.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <Card className="max-w-md w-full">
          <CardBody className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              color="primary"
              onPress={() => window.location.reload()}
            >
              Recargar
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Si no tiene sucursales
  if (sucursales.length === 0) {
    const handleCerrarSesion = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/signin";
      } catch (err) {
        console.error("Error al cerrar sesión:", err);
        // Forzar redirección de todos modos
        window.location.href = "/signin";
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <Card className="max-w-md w-full">
          <CardBody className="text-center py-8">
            <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Sin sucursales asignadas
            </h2>
            <p className="text-slate-600 mb-6">
              No tienes acceso a ninguna sucursal. Contacta al administrador
              para que te asigne una.
            </p>
            <Button
              color="default"
              variant="bordered"
              onPress={handleCerrarSesion}
              className="w-full"
            >
              Cerrar sesión
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl">
          <CardBody className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Selecciona una sucursal
              </h1>
              <p className="text-slate-600">
                Elige la sucursal con la que deseas trabajar
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Lista de sucursales */}
            <div className="space-y-3 mb-6">
              {sucursales.map((sucursal) => (
                <motion.button
                  key={sucursal.id}
                  onClick={() => seleccionarSucursal(sucursal.id)}
                  disabled={isSelecting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold group-hover:scale-110 transition-transform">
                        {sucursal.nombre.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 truncate">
                          {sucursal.nombre}
                        </h3>
                        {sucursal.esPrincipal && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                            Principal
                          </span>
                        )}
                        {sucursal.esDefault && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Por defecto
                          </span>
                        )}
                      </div>
                      {sucursal.direccion && (
                        <p className="text-sm text-slate-600 truncate">
                          {sucursal.direccion}
                        </p>
                      )}
                    </div>
                    {isSelecting ? (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : (
                      <Check className="h-5 w-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-slate-500">
              <p>
                Esta selección se guardará y podrás cambiarla desde el menú
                lateral
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}

