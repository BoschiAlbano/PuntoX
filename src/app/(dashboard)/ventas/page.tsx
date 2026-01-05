"use client";

import React from "react";
import VentasScreen from "@/components/ventas/VentasScreen";
import { usePagePermission } from "@/lib/permissions/usePagePermission";

export default function VentasPage() {
  const { tieneAcceso, isLoading: isLoadingPermisos } = usePagePermission();
  
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

  // Si no tiene acceso, no renderizar nada (usePagePermission ya redirige)
  // Si tieneAcceso es undefined, aún está cargando, mostrar loading
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

  if (tieneAcceso === false) {
    return null; // usePagePermission ya redirige
  }

  return (
    <div className="h-full w-full p-2 md:p-4">
      <VentasScreen />
    </div>
  );
}
