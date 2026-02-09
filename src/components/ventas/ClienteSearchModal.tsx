"use client";

import React, { useState } from "react";
import {
  Input,
  Button,
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
  Spinner,
  addToast,
} from "@heroui/react";
import { Search, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { consumidorFinalSchema } from "@/lib/validations/consumidorFinal.schema";
import { LoadingComponent } from "../loading/loading";
import ClienteForm from "../clientes/ClienteForm";

interface ClienteSearchModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  handleSelect: (client: any) => void;
}

// Hook para debounce
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

export default function ClienteSearchModal({
  isOpen,
  onOpenChange,
  handleSelect,
}: ClienteSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounceValue(searchQuery, 500);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const queryClient = useQueryClient();

  const [items, setItems] = useState([]);
  // Fetch optimizado para ventas
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["clientes_ventas", debouncedSearch],
    queryFn: async ({ signal }) => {
      // Usamos la nueva API optimizada
      const res = await fetch(`/api/ventas/clientes?q=${debouncedSearch}`, {
        signal,
      });
      if (!res.ok) return [];
      const data = await res.json();
      setItems(data);
      return data;
    },
    enabled: isOpen,
    refetchOnMount: true,
    staleTime: 0, // Marca los datos como obsoletos inmediatamente
    gcTime: 0, // No mantener en caché para evitar mostrar datos previos
  });

  const createClientMutation = useMutation({
    mutationFn: async (newClient: any) => {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear cliente");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clientes_ventas"] });
      const newClient = data.cliente;
      addToast({
        title: "Cliente creado",
        description: `${newClient.nombre} ${newClient.apellido} ha sido creado exitosamente`,
        color: "success",
      });
      setIsCreateClientOpen(false);

      // Agregamos campos calculados que no vienen en el POST pero si en el GET
      newClient.saldoActual = 0;
      newClient.margenDisponible = newClient.tieneLimiteCompra
        ? newClient.montoMaximoCtaCte
        : null;

      handleSelect(newClient);
    },
    onError: (err: Error) => {
      addToast({
        title: "Error",
        description: err.message,
        color: "danger",
      });
    },
  });

  // const items = data || [];

  return (
    <>
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

                <div className="h-[250px]">
                  {isLoading || isFetching ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingComponent message="Cargando Clientes..." />
                    </div>
                  ) : (
                    <Table
                      aria-label="Resultados Clientes"
                      removeWrapper
                      bottomContent={
                        items?.length > 50 && (
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
                  )}
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
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Plus size={18} />}
                  onPress={() => setIsCreateClientOpen(true)}
                >
                  Agregar Cliente
                </Button>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <ClienteForm
        isOpen={isCreateClientOpen}
        onClose={() => setIsCreateClientOpen(false)}
        initialData={null}
        onSubmit={(data) => createClientMutation.mutate(data)}
        isSaving={createClientMutation.isPending}
      />
    </>
  );
}
