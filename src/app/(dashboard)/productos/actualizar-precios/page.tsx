"use client";

import ActualizarPreciosContainer from "@/components/productos/ActualizarPrecios";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function ActualizarPreciosPage() {
  return (
    <div className="max-w-350 mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Actualización Masiva"
        accentTitle="Precios"
        description="Herramienta para actualizar precios masivamente por marca o rubro."
      />

      <ActualizarPreciosContainer />
    </div>
  );
}
