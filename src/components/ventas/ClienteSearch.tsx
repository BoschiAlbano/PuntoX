"use client";

import { useDisclosure } from "@heroui/react";
import { User, UserCheck, ChevronRight, ChevronDown } from "lucide-react";
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

  const displayName =
    selected.Id === 0
      ? "Consumidor Final"
      : `${selected.Nombre} ${selected.Apellido}`;

  const displayDni =
    selected.Id === 0 ? consumidorFinalSchema.Dni : selected.Dni || "Sin DNI";

  return (
    <div className="w-full">
      <button
        onClick={onOpen}
        className="w-full bg-white rounded-xl p-4 flex items-center gap-3 transition-colors cursor-pointer"
      >
        {/* Ícono con fondo teal */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
          {selected.Id === 0 ? (
            <User size={20} className="text-gray-500" />
          ) : (
            <UserCheck size={20} className="text-gray-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="text-gray-500 font-semibold text-sm truncate w-full text-left">
            {displayName}
          </span>
          <span className="text-gray-500 text-xs">{displayDni}</span>
        </div>

        {/* Chevron */}
        <ChevronDown size={18} className="text-gray-500 shrink-0 mr-2" />
      </button>

      <ClienteSearchModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        handleSelect={handleSelect}
      />
    </div>
  );
}
