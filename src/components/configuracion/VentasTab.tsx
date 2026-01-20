"use client";

import { SectionPanel } from "./SectionPanel";
import { PreferenciasBasicas } from "./ventas/PreferenciasBasicas";
import { ConfiguracionStock } from "./ventas/ConfiguracionStock";
import { ConfiguracionCaja } from "./ventas/ConfiguracionCaja";
import { ConfiguracionProductos } from "./ventas/ConfiguracionProductos";
import { ConfiguracionBascula } from "./ventas/ConfiguracionBascula";

export function VentasTab() {
  return (
    <SectionPanel
      id="ventas"
      title="Preferencias de venta"
      description="Personalice el comportamiento del punto de venta"
      summary="Configure tickets, stock, caja y otros aspectos de la venta"
    >
      <div className="space-y-6">
        <PreferenciasBasicas />
        <ConfiguracionStock />
        <ConfiguracionCaja />
        <ConfiguracionProductos />
        <ConfiguracionBascula />
      </div>
    </SectionPanel>
  );
}
