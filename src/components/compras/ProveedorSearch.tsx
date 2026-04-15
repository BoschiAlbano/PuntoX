"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Input, Button } from "@heroui/react";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ProveedorCompra } from "@/store/useCompraStore";

interface ProveedorSearchProps {
  selected: ProveedorCompra | null;
  onSelect: (proveedor: ProveedorCompra | null) => void;
}

export default function ProveedorSearch({ selected, onSelect }: ProveedorSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: proveedores = [], isFetching } = useQuery({
    queryKey: ["proveedores-search", query],
    queryFn: async () => {
      const res = await fetch(`/api/proveedores?q=${encodeURIComponent(query)}&limit=8`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: query.length >= 1,
    staleTime: 10_000,
  });

  const handleSelect = (p: any) => {
    onSelect({ Id: Number(p.Id), RazonSocial: p.RazonSocial });
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
  };

  useEffect(() => {
    setIsOpen(query.length >= 1 && proveedores.length > 0);
  }, [query, proveedores]);

  return (
    <div className="p-3 flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Proveedor *</p>

      {selected ? (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#67afc3]/8 border border-[#67afc3]/25">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#67afc3]/15 border border-[#67afc3]/20 flex items-center justify-center text-[#67afc3] font-bold text-sm shrink-0">
              {selected.RazonSocial.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-slate-800 truncate">
              {selected.RazonSocial}
            </span>
          </div>
          <button
            onClick={handleClear}
            className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
            aria-label="Quitar proveedor"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            placeholder="Buscar proveedor..."
            value={query}
            onValueChange={setQuery}
            startContent={<Search size={14} className="text-slate-400" />}
            size="sm"
            variant="flat"
            classNames={{
              inputWrapper: "rounded-lg bg-slate-50 h-9 min-h-9 border border-slate-200",
              input: "text-xs",
            }}
            onFocus={() => query.length >= 1 && setIsOpen(true)}
          />

          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
              {isFetching ? (
                <div className="px-4 py-3 text-xs text-slate-400">Buscando...</div>
              ) : (
                proveedores.map((p: any) => (
                  <button
                    key={p.Id}
                    onClick={() => handleSelect(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#67afc3]/10 text-[#67afc3] font-bold text-sm flex items-center justify-center shrink-0">
                      {p.RazonSocial.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate">{p.RazonSocial}</span>
                      {p.CUIT && (
                        <span className="text-[10px] text-slate-400 font-mono">CUIT: {p.CUIT}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
