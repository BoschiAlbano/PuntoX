"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import {
  Mail,
  BadgeDollarSign,
  Wallet,
  ListOrdered,
  Save,
} from "lucide-react";
import { useConfiguracion, PreferenciasVenta } from "@/hooks/useConfiguracion";
import { VentasSection, ToggleRow } from "./VentasPrimitives";

export function PreferenciasBasicas() {
  const {
    preferenciasVenta,
    savePreferenciasVenta,
    isSavingPreferenciasVenta,
    isLoadingPreferenciasVenta,
  } = useConfiguracion({ enablePreferenciasVenta: true });

  const [preferencias, setPreferencias] = useState<PreferenciasVenta>({
    ticketDigitalPorCorreo: true,
    mostrarPreciosConIva: true,
    abrirCajonEfectivo: true,
    numerarPedidosPantalla: true,
  });

  useEffect(() => {
    if (preferenciasVenta) setPreferencias(preferenciasVenta);
  }, [preferenciasVenta]);

  const hasChanges =
    JSON.stringify(preferencias) !== JSON.stringify(preferenciasVenta);

  return (
    <VentasSection title="Preferencias básicas" icon={BadgeDollarSign}>
      <ToggleRow
        icon={Mail}
        title="Enviar ticket digital por correo"
        description="Envía automáticamente el comprobante por email al cliente tras cada venta"
        isSelected={preferencias.ticketDigitalPorCorreo}
        onValueChange={(v) =>
          setPreferencias({ ...preferencias, ticketDigitalPorCorreo: v })
        }
        isDisabled={isLoadingPreferenciasVenta}
      />
      <ToggleRow
        icon={BadgeDollarSign}
        title="Mostrar precios con impuestos incluidos"
        description="Los precios se mostrarán con IVA incluido en todas las pantallas del sistema"
        isSelected={preferencias.mostrarPreciosConIva}
        onValueChange={(v) =>
          setPreferencias({ ...preferencias, mostrarPreciosConIva: v })
        }
        isDisabled={isLoadingPreferenciasVenta}
      />
      <ToggleRow
        icon={Wallet}
        title="Abrir cajón al cobrar en efectivo"
        description="El cajón de dinero se abrirá automáticamente al registrar un pago en efectivo"
        isSelected={preferencias.abrirCajonEfectivo}
        onValueChange={(v) =>
          setPreferencias({ ...preferencias, abrirCajonEfectivo: v })
        }
        isDisabled={isLoadingPreferenciasVenta}
      />
      <ToggleRow
        icon={ListOrdered}
        title="Numerar pedidos y mostrar en pantalla"
        description="Asigna números secuenciales a los pedidos y los muestra en la pantalla de cocina o preparación"
        isSelected={preferencias.numerarPedidosPantalla}
        onValueChange={(v) =>
          setPreferencias({ ...preferencias, numerarPedidosPantalla: v })
        }
        isDisabled={isLoadingPreferenciasVenta}
      />

      {hasChanges && (
        <div className="flex justify-end pt-2">
          <Button
            onPress={() => savePreferenciasVenta(preferencias)}
            isLoading={isSavingPreferenciasVenta}
            className="bg-linear-to-r from-[#67afc3] to-[#2dd4bf] text-white font-bold px-6 h-10 shadow-md shadow-[#67afc3]/20 rounded-xl gap-2"
            startContent={!isSavingPreferenciasVenta && <Save size={15} />}
          >
            Guardar preferencias
          </Button>
        </div>
      )}
    </VentasSection>
  );
}
