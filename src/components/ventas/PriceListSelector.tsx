"use client";

import { useQuery } from "@tanstack/react-query";
import { Select, SelectItem } from "@heroui/react";
import { Tag } from "lucide-react";
import { useEffect } from "react";
import { useVentaStore } from "@/store/ventaStore";

interface PriceListSelectorProps {
  listaPrecios: number | null;
  setListaPrecios: (lista: number | null) => void;
}

export default function PriceListSelector({
  listaPrecios,
  setListaPrecios,
}: PriceListSelectorProps) {
  const { cliente } = useVentaStore();

  const { data: listas = [], isLoading } = useQuery({
    queryKey: ["listas-precios-activas"],
    queryFn: async () => {
      const res = await fetch("/api/listas-precios");
      if (!res.ok) throw new Error("Error fetching");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Set default list if none is selected
  useEffect(() => {
    if (!listaPrecios && listas.length > 0) {
      const defaultList = listas.find((l: any) => l.PorDefecto);
      if (defaultList) {
        setListaPrecios(defaultList.Id);
      } else {
        setListaPrecios(listas[0].Id);
      }
    }
  }, [listaPrecios, listas, setListaPrecios]);

  return (
    <div className="w-full sm:w-[200px] flex items-center shrink-0">
      <Select
        aria-label="Lista de Precios"
        placeholder="Seleccionar Lista"
        selectedKeys={listaPrecios ? [listaPrecios.toString()] : []}
        onChange={(e) => {
          if (e.target.value) {
            setListaPrecios(Number(e.target.value));
          } else {
            setListaPrecios(null);
          }
        }}
        isLoading={isLoading}
        size="sm"
        startContent={<Tag size={14} className="text-slate-400" />}
        classNames={{
          trigger: "h-10 min-h-10 bg-white border border-slate-300 hover:border-[#67afc3] hover:bg-slate-50 rounded-lg shadow-none transition-colors",
          value: "font-semibold text-slate-700 text-[13px]"
        }}
      >
        {listas.map((lista: any) => (
          <SelectItem key={lista.Id} textValue={lista.Nombre}>
            <div className="flex items-center justify-between w-full">
              <span className="font-medium text-[13px]">{lista.Nombre}</span>
              <div className="flex gap-1">
                {cliente?.ListaPrecioId === lista.Id && lista.PorDefecto ? (
                  <span className="text-[10px] text-[#67afc3] font-bold bg-[#67afc3]/10 px-1.5 py-0.5 rounded">
                    Defecto
                  </span>
                ) : (
                  <>
                    {cliente?.ListaPrecioId === lista.Id && (
                      <span className="text-[10px] text-[#67afc3] font-bold bg-[#67afc3]/10 px-1.5 py-0.5 rounded">
                        Cliente
                      </span>
                    )}
                    {lista.PorDefecto && (
                      <span className="text-[10px] text-[#67afc3] font-bold bg-[#67afc3]/10 px-1.5 py-0.5 rounded">
                        Sistema
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
