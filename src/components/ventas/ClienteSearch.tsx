"use client";

import React, { useState } from "react";
import {
  Input,
  Button,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
} from "@heroui/react";
import { Search, User, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { consumidorFinalSchema } from "@/lib/validations/consumidorFinal.schema";

interface ClienteSearchProps {
  selected: any;
  onSelect: (c: any) => void;
}

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ClienteSearch({
  selected,
  onSelect,
}: ClienteSearchProps) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounceValue(searchQuery, 500);

  // Fetch optimizado para ventas
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["clientes_ventas", debouncedSearch],
    queryFn: async ({ signal }) => {
      // Usamos la nueva API optimizada
      const res = await fetch(`/api/ventas/clientes?q=${debouncedSearch}`, {
        signal,
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen,
    refetchOnMount: true, // Siempre refrescar para traer saldo actualizado
    staleTime: 0,
  });

  const items = data || [];

  const handleSelect = (client: any) => {
    // Mapeamos la respuesta de la API (camelCase) al formato esperado por VentaFooter (PascalCase + estructura anidada)
    const mappedClient = {
      Id: client.id,
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
    setSearchQuery("");
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
            {selected.Id === 0 ? "99999999" : selected.Dni || "Sin DNI"}
          </span>
        </div>
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Buscar Cliente</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  placeholder="Buscar por Nombre, DNI, Email..."
                  startContent={
                    <Search className="text-default-400" size={18} />
                  }
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                />

                <div className="min-h-[250px]">
                  <Table
                    aria-label="Resultados Clientes"
                    removeWrapper
                    bottomContent={
                      data?.length > 50 && (
                        <div className="flex w-full justify-center p-2">
                          <span className="text-tiny text-default-400">
                            Mostrando primeros 50 resultados
                          </span>
                        </div>
                      )
                    }
                  >
                    <TableHeader>
                      <TableColumn>NOMBRE</TableColumn>
                      <TableColumn>DNI</TableColumn>
                      <TableColumn>EMAIL</TableColumn>
                      <TableColumn>ACCION</TableColumn>
                    </TableHeader>
                    <TableBody
                      items={items}
                      loadingContent={<Spinner />}
                      loadingState={
                        isLoading || isFetching ? "loading" : "idle"
                      }
                      emptyContent="No se encontraron clientes"
                    >
                      {(item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.nombreCompleto}</TableCell>
                          <TableCell>{item.dni || "-"}</TableCell>
                          <TableCell>{item.mail || "-"}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              color="primary"
                              onPress={() => handleSelect(item)}
                            >
                              Seleccionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex-1">
                  {/* Quick action to revert to default */}
                  <Button
                    variant="light"
                    onPress={() =>
                      handleSelect({
                        ...consumidorFinalSchema,
                      })
                    }
                  >
                    Usar Consumidor Final
                  </Button>
                </div>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
