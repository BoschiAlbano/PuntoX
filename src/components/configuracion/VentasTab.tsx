"use client";

import { ConfiguracionStock } from "./ventas/ConfiguracionStock";
import { ConfiguracionCaja } from "./ventas/ConfiguracionCaja";
import { ConfiguracionProductos } from "./ventas/ConfiguracionProductos";
import { ConfiguracionBascula } from "./ventas/ConfiguracionBascula";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { VentasTabSkeleton } from "./ConfiguracionSkeleton";

export function VentasTab() {
  const { isLoadingConfiguracion } = useConfiguracion({
    enableConfiguracion: true,
  });

  if (isLoadingConfiguracion) {
    return <VentasTabSkeleton />;
  }

  return (
    <div className="pt-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="space-y-5 pb-6">
          <ConfiguracionStock />
          <ConfiguracionCaja />
          <ConfiguracionProductos />
          <ConfiguracionBascula />
        </div>
      </div>
    </div>
  );
}
