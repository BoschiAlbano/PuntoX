"use client";

import { useDisclosure } from "@heroui/react";
import { User, UserCheck, ChevronDown } from "lucide-react";
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

  const isConsumidorFinal = selected.Id === 0;

  const displayName = isConsumidorFinal
    ? "Consumidor Final"
    : `${selected.Nombre} ${selected.Apellido}`;

  const displayDni = isConsumidorFinal
    ? consumidorFinalSchema.Dni
    : selected.Dni || "Sin DNI";

  return (
    <div className="w-full">
      <button
        onClick={onOpen}
        className="w-full rounded-xl px-3 py-2.5 flex items-center gap-3 transition-colors hover:bg-slate-50 active:bg-slate-100 cursor-pointer group"
        aria-label="Seleccionar cliente"
      >
        {/* Avatar icon */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isConsumidorFinal
              ? "bg-slate-100 text-slate-400"
              : "bg-[#67afc3]/10 text-[#67afc3]"
          }`}
        >
          {isConsumidorFinal ? (
            <User size={16} />
          ) : (
            <UserCheck size={16} />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span
            className={`font-semibold text-xs truncate w-full text-left leading-tight transition-colors ${
              isConsumidorFinal ? "text-slate-500" : "text-slate-700"
            }`}
          >
            {displayName}
          </span>
          <span className="text-slate-400 text-[10px] leading-tight font-mono">
            {displayDni}
          </span>
        </div>

        {/* Cta */}
        <span className="text-[9px] font-semibold text-slate-400 group-hover:text-[#67afc3] uppercase tracking-wide transition-colors hidden sm:block shrink-0">
          Cambiar
        </span>
        <ChevronDown
          size={14}
          className="text-slate-400 shrink-0 group-hover:text-[#67afc3] transition-colors"
        />
      </button>

      <ClienteSearchModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        handleSelect={handleSelect}
      />
    </div>
  );
}
