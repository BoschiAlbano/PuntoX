"use client";

import { useDisclosure } from "@heroui/react";
import { User, X } from "lucide-react";
import ClienteSearchModal from "./ClienteSearchModal";
import { consumidorFinalSchema } from "@/lib/validations/consumidorFinal.schema";

interface ClienteSearchProps {
  selected: any;
  onSelect: (c: any) => void;
}

export default function ClienteSearch({
  selected,
  onSelect,
}: ClienteSearchProps) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const handleSelect = (client: any) => {
    const mappedClient = {
      Id: client?.id || 0,
      Nombre: client.nombre,
      Apellido: client.apellido,
      Dni: client.dni,
      Mail: client.mail,
      Direccion: client.direccion,
      ListaPrecioId: client.ListaPrecioId,
      Persona_Cliente: {
        ActivarCtaCte: client.activarCtaCte,
        TieneLimiteCompra: client.tieneLimiteCompra,
        MontoMaximoCtaCte: client.montoMaximoCtaCte,
        SaldoActual: client.saldoActual,
        MargenDisponible: client.margenDisponible,
      },
    };
    onSelect(mappedClient);
    onClose();
  };

  const handleClear = () => {
    onSelect({
      Id: 0,
      Nombre: consumidorFinalSchema.Nombre,
      Apellido: consumidorFinalSchema.Apellido,
      Dni: consumidorFinalSchema.Dni,
      Mail: consumidorFinalSchema.Mail,
      Direccion: consumidorFinalSchema.Direccion,
      ListaPrecioId: null,
      Persona_Cliente: {
        ActivarCtaCte: false,
        TieneLimiteCompra: false,
        MontoMaximoCtaCte: 0,
        SaldoActual: 0,
        MargenDisponible: 0,
      },
    });
  };

  const isConsumidorFinal = selected.Id === 0;
  const displayName = `${selected.Nombre} ${selected.Apellido}`;

  return (
    <div className="w-full">
      {isConsumidorFinal ? (
        <button
          onClick={onOpen}
          data-shortcut="cliente-trigger"
          className="w-full h-10 bg-white rounded-lg border border-slate-300 flex items-center justify-start gap-2 px-3 hover:border-[#67afc3] hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Seleccionar cliente"
        >
          <User size={15} className="text-[#67afc3] shrink-0" />
          <span className="text-xs font-medium text-slate-500">Buscar cliente...</span>
        </button>
      ) : (
        <div className="flex bg-white rounded-lg border border-slate-300 items-center justify-between px-3 h-10">
          <div className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1" onClick={onOpen} data-shortcut="cliente-trigger">
            <div className="w-7 h-7 rounded-lg bg-[#67afc3]/15 border border-[#67afc3]/20 flex items-center justify-center text-[#67afc3] font-bold text-sm shrink-0">
              {selected.Nombre.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate">
              {displayName}
            </span>
          </div>
          <button
            onClick={handleClear}
            className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50 shrink-0"
            aria-label="Quitar cliente"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <ClienteSearchModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        handleSelect={handleSelect}
      />
    </div>
  );
}
