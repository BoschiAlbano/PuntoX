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
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="3xl"
        backdrop="blur"
        classNames={{
          base: "bg-white/95 backdrop-blur-3xl shadow-2xl border border-white/60 rounded-[24px]",
          header: "border-b border-slate-100/60 pb-4 pt-6 px-6 sm:px-8",
          body: "py-6 px-4 sm:px-8",
          footer: "border-t border-slate-100/60 py-4 px-4 sm:px-8",
          closeButton:
            "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
        }}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              scale: 1,
              transition: { duration: 0.3, ease: "easeOut" },
            },
            exit: {
              y: -20,
              opacity: 0,
              scale: 0.95,
              transition: { duration: 0.2, ease: "easeIn" },
            },
          },
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 shadow-sm">
                    <Search className="w-5 h-5 text-[#67afc3]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                      Buscador de Clientes
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Encuentra o registra un cliente para asociarlo a la venta
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                {/* Modern Input */}
                <Input
                  placeholder="Buscar por Nombre, DNI, Email..."
                  startContent={
                    <Search className="text-slate-400 mr-2" size={18} />
                  }
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                  classNames={{
                    inputWrapper:
                      "bg-slate-50 hover:bg-slate-100 focus-within:!bg-white border-2 border-transparent focus-within:!border-[#67afc3]/40 transition-all shadow-sm rounded-xl h-14",
                    input: "text-slate-700 font-medium text-[15px]",
                    clearButton: "text-slate-400",
                  }}
                />

                {/* Table Container */}
                <div className="h-[320px] border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm relative flex flex-col mt-2">
                  {isLoading || isFetching ? (
                    <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50/50">
                      <LoadingComponent message="Buscando clientes..." />
                    </div>
                  ) : (
                    <Table
                      aria-label="Resultados Clientes"
                      removeWrapper
                      selectionMode="single"
                      onRowAction={(key) => {
                        const selectedItem = items.find(
                          (item: any) => item.id == key,
                        );
                        if (selectedItem) handleSelect(selectedItem);
                      }}
                      classNames={{
                        base: "h-full flex flex-col overflow-auto scrollbar-hide",
                        table: "min-h-0",
                        thead: "sticky top-0 z-20 shrink-0",
                        th: "bg-slate-50/90 backdrop-blur-md text-slate-400 font-bold text-xs tracking-wider border-b border-slate-100 h-11 first:rounded-l-none last:rounded-r-none uppercase",
                        tr: "hover:bg-[#67afc3]/5 transition-colors border-b border-slate-50 last:border-none cursor-pointer group",
                        td: "py-3.5 text-sm text-slate-600 font-medium",
                        emptyWrapper: "h-full w-full block",
                      }}
                      bottomContent={
                        items?.length > 50 && (
                          <div className="flex w-full justify-center p-3 border-t border-slate-100 bg-slate-50/50">
                            <span className="text-xs font-semibold text-slate-400">
                              Mostrando primeros 50 resultados.
                            </span>
                          </div>
                        )
                      }
                    >
                      <TableHeader>
                        <TableColumn>CLIENTE / EMPRESA</TableColumn>
                        <TableColumn>IDENTIFICACIÓN</TableColumn>
                        <TableColumn>CONTACTO</TableColumn>
                        <TableColumn align="center">ACCIÓN</TableColumn>
                      </TableHeader>
                      <TableBody
                        items={items}
                        loadingState={
                          isLoading || isFetching ? "loading" : "idle"
                        }
                        emptyContent={
                          <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
                            <div className="p-3 bg-slate-50 rounded-full">
                              <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium">
                              No se encontraron clientes coincidentes
                            </p>
                          </div>
                        }
                      >
                        {(item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                  {item.nombreCompleto?.charAt(0).toUpperCase()}
                                </div>
                                <span className="group-hover:text-[#67afc3] transition-colors font-semibold truncate max-w-[180px]">
                                  {item.nombreCompleto}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-slate-600 tabular-nums">
                                {item.dni || item.cuit || item.Cuit || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="truncate max-w-[150px] inline-block">
                                {item.mail || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                className="bg-slate-100 text-slate-600 font-semibold group-hover:bg-[#67afc3] group-hover:text-white transition-all shadow-sm w-full"
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
              <ModalFooter className="flex items-center justify-between w-full flex-wrap gap-2">
                <Button
                  className="bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 shrink-0"
                  size="md"
                  onPress={() => handleSelect({ ...consumidorFinalSchema })}
                >
                  Consumidor Final
                </Button>
                <div className="flex gap-2">
                  <Button
                    className="text-slate-500 font-medium hover:bg-slate-100"
                    variant="light"
                    onPress={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-[#67afc3] text-white font-semibold shadow-md shadow-[#67afc3]/20"
                    startContent={<Plus size={18} strokeWidth={2.5} />}
                    onPress={() => setIsCreateClientOpen(true)}
                  >
                    Nuevo Cliente
                  </Button>
                </div>
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
