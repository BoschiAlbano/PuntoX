"use client";

import { ConfiguracionStock } from "./ventas/ConfiguracionStock";
import { ConfiguracionCaja } from "./ventas/ConfiguracionCaja";
import { ConfiguracionProductos } from "./ventas/ConfiguracionProductos";
import { ConfiguracionBascula } from "./ventas/ConfiguracionBascula";

export function VentasTab() {
  return (
    <div className="space-y-5 pt-4 pb-6">
      <ConfiguracionStock />
      <ConfiguracionCaja />
      <ConfiguracionProductos />
      <ConfiguracionBascula />
    </div>
  );
}
