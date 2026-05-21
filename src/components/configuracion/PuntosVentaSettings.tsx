"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import { Store, Hash, Save } from "lucide-react";
import { VentasSection } from "./ventas/VentasPrimitives";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";

interface PuntoVenta {
  sucursalId: number;
  nombre: string;
  puntoVentaAfip: number | null;
  domicilioFiscal: string;
}

export function PuntosVentaSettings() {
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState<PuntoVenta[]>([]);
  
  const { data, isLoading } = useQuery({
    queryKey: ["puntos-venta-fiscal"],
    queryFn: async () => {
      const res = await fetch("/api/configuracion/fiscal/puntos-venta");
      if (!res.ok) throw new Error("Error al cargar puntos de venta");
      return (await res.json()).puntosVenta as PuntoVenta[];
    }
  });

  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (payload: { puntosVenta: PuntoVenta[] }) => {
      const res = await fetch("/api/configuracion/fiscal/puntos-venta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al guardar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["puntos-venta-fiscal"] });
      addToast({ title: "Guardado exitoso", description: "Puntos de venta guardados correctamente", color: "success" });
    },
    onError: () => {
      addToast({ title: "Error", description: "Error al guardar los puntos de venta", color: "danger" });
    }
  });

  const hasChanges = JSON.stringify(data) !== JSON.stringify(localData);

  const handleUpdate = (id: number, field: string, value: any) => {
    setLocalData(prev => prev.map(p => p.sucursalId === id ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
    const validData = localData.map(p => ({
      sucursalId: p.sucursalId,
      puntoVentaAfip: p.puntoVentaAfip ? Number(p.puntoVentaAfip) : null,
      domicilioFiscal: p.domicilioFiscal || "",
    }));
    mutation.mutate({ puntosVenta: validData as any });
  };

  return (
    <VentasSection title="Puntos de Venta (PDV) por Sucursal" icon={Store}>
      <div className="space-y-4 px-1">
        {isLoading ? (
          <p className="text-sm text-slate-500">Cargando sucursales...</p>
        ) : (
          <div className="space-y-3">
            {localData.map((pdv) => (
              <div key={pdv.sucursalId} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl items-start sm:items-center">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <Store size={14} className="text-slate-400" />
                    {pdv.nombre}
                  </h4>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Input
                    label="Punto de Venta"
                    labelPlacement="outside"
                    placeholder="Ej: 1"
                    type="number"
                    variant="bordered"
                    size="sm"
                    className="w-32"
                    classNames={{
                      label: "text-[10px] font-bold uppercase tracking-widest text-slate-500",
                      inputWrapper: "h-10 border-slate-200 bg-white"
                    }}
                    value={pdv.puntoVentaAfip?.toString() || ""}
                    onChange={(e) => handleUpdate(pdv.sucursalId, "puntoVentaAfip", e.target.value)}
                    startContent={<Hash size={14} className="text-slate-400 shrink-0" />}
                  />
                  <Input
                    label="Domicilio Fiscal"
                    labelPlacement="outside"
                    placeholder="Opcional"
                    variant="bordered"
                    size="sm"
                    className="w-full sm:w-64"
                    classNames={{
                      label: "text-[10px] font-bold uppercase tracking-widest text-slate-500",
                      inputWrapper: "h-10 border-slate-200 bg-white"
                    }}
                    value={pdv.domicilioFiscal || ""}
                    onChange={(e) => handleUpdate(pdv.sucursalId, "domicilioFiscal", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            onPress={handleSave}
            isLoading={mutation.isPending}
            isDisabled={!hasChanges}
            className={`font-bold px-6 h-10 rounded-xl gap-2 transition-all ${
              hasChanges
                ? "bg-[#67afc3] text-white shadow-md hover:shadow-lg"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
            startContent={!mutation.isPending && <Save size={14} />}
          >
            {hasChanges ? "Guardar PDVs" : "Sin cambios"}
          </Button>
        </div>
      </div>
    </VentasSection>
  );
}
