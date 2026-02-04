"use client";

import { Button, useDisclosure } from "@heroui/react";
import { User, UserCheck } from "lucide-react";
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
    // Mapeamos la respuesta de la API (camelCase) al formato esperado por VentaFooter (PascalCase + estructura anidada)
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
        // Agregamos datos calculados
        SaldoActual: client.saldoActual,
        MargenDisponible: client.margenDisponible,
      },
    };
    onSelect(mappedClient);
    onClose();
  };

  return (
    <>
      <Button
        variant="flat"
        // color={selected.Id === 0 ? "default" : "primary"}
        onPress={onOpen}
        className="justify-start min-w-[200px] py-6 bg-[#67afc3da] text-white"
        startContent={
          selected.Id === 0 ? <User size={18} /> : <UserCheck size={18} />
        }
      >
        <div className="flex flex-col items-start leading-tight">
          <span className="text-small font-semibold">
            {selected.Id === 0
              ? "Consumidor Final"
              : selected.Nombre + " " + selected.Apellido}
          </span>
          <span className="text-tiny opacity-75">
            {selected.Id === 0
              ? consumidorFinalSchema.Dni
              : selected.Dni || "Sin DNI"}
          </span>
        </div>
      </Button>

      <ClienteSearchModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        handleSelect={handleSelect}
      />
    </>
  );
}
