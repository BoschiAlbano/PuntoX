"use client";

import React, { useState, useEffect } from "react";
import { modalMotionProps } from "@/lib/motionConfig";
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
  addToast,
} from "@heroui/react";
import { Search, Plus, User } from "lucide-react";
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
  useEffect(() => {
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
  const debouncedSearch = useDebounceValue(searchQuery, 400);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const queryClient = useQueryClient();

  // Resetear búsqueda cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) setSearchQuery("");
  }, [isOpen]);

  const [items, setItems] = useState([]);
  const { isLoading, isFetching } = useQuery({
    queryKey: ["clientes_ventas", debouncedSearch],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/ventas/clientes?q=${debouncedSearch}`, { signal });
      if (!res.ok) return [];
      const data = await res.json();
      setItems(data);
      return data;
    },
    enabled: isOpen,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
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
      newClient.saldoActual = 0;
      newClient.margenDisponible = newClient.tieneLimiteCompra
        ? newClient.montoMaximoCtaCte
        : null;
      handleSelect(newClient);
    },
    onError: (err: Error) => {
      addToast({ title: "Error", description: err.message, color: "danger" });
    },
  });

  const emptyState = (
    <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-3 h-full">
      <div className="p-3 bg-slate-50 rounded-full">
        <Search className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-center">
        {searchQuery.length === 0
          ? "Ingresa un nombre, DNI o email para buscar"
          : "No se encontraron clientes coincidentes"}
      </p>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="3xl"
        backdrop="opaque"
        motionProps={modalMotionProps}
        classNames={{
          base: "bg-white shadow-2xl border border-slate-200 sm:rounded-[24px] rounded-none m-0 sm:m-auto h-full sm:h-auto sm:max-h-[85vh]",
          header: "border-b border-slate-100 pb-3 pt-4 sm:pb-4 sm:pt-6 px-4 sm:px-8",
          body: "py-3 sm:py-6 px-3 sm:px-8 flex-1 overflow-hidden flex flex-col",
          footer: "border-t border-slate-100 py-3 sm:py-4 px-4 sm:px-8",
          closeButton: "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#67afc3]/10 border border-[#67afc3]/20">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#67afc3]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-extrabold text-slate-800 tracking-tight">
                      Buscar Cliente
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">
                      Selecciona o registra un cliente para asociarlo a la venta
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody>
                <Input
                  placeholder="Buscar por Nombre, DNI, Email..."
                  startContent={<Search className="text-slate-400 mr-1 sm:mr-2" size={16} />}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                  autoFocus
                  isClearable
                  classNames={{
                    inputWrapper:
                      "bg-slate-50 hover:bg-slate-100 focus-within:!bg-white border-2 border-transparent focus-within:!border-[#67afc3]/40 transition-all shadow-sm rounded-xl h-11 sm:h-14",
                    input: "text-slate-700 font-medium text-sm sm:text-[15px]",
                    clearButton: "text-slate-400",
                  }}
                />

                <div className="flex-1 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm relative flex flex-col mt-2 min-h-0 sm:h-[320px] sm:flex-none">
                  {isLoading || isFetching ? (
                    <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50/50">
                      <LoadingComponent message="Buscando clientes..." />
                    </div>
                  ) : items.length === 0 ? (
                    emptyState
                  ) : (
                    <>
                      {/* ── MOBILE CARD LIST (<sm) ── */}
                      <div className="sm:hidden flex-1 overflow-auto scrollbar-hide divide-y divide-slate-50">
                        {items.map((item: any) => (
                          <button
                            key={item.id}
                            onClick={() => { handleSelect(item); onClose(); }}
                            className="w-full px-3 py-3 flex items-center gap-3 hover:bg-[#67afc3]/5 active:bg-[#67afc3]/10 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#67afc3] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {item.nombreCompleto?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-700 text-xs leading-snug line-clamp-1">
                                {item.nombreCompleto}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {item.dni || item.cuit || "-"}
                              </span>
                              {item.mail && (
                                <span className="text-[10px] text-slate-400 truncate">{item.mail}</span>
                              )}
                            </div>
                            <div className="shrink-0 w-8 h-8 rounded-lg bg-[#67afc3]/10 flex items-center justify-center">
                              <Plus size={16} className="text-[#67afc3]" />
                            </div>
                          </button>
                        ))}
                        {items.length >= 50 && (
                          <div className="flex w-full justify-center p-3 bg-slate-50/50">
                            <span className="text-[10px] font-semibold text-slate-400">
                              Mostrando primeros 50 resultados. Afina tu búsqueda.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ── DESKTOP TABLE (sm+) ── */}
                      <Table
                        aria-label="Resultados Clientes"
                        removeWrapper
                        selectionMode="single"
                        onRowAction={(key) => {
                          const selectedItem = items.find((item: any) => item.id == key);
                          if (selectedItem) { handleSelect(selectedItem); onClose(); }
                        }}
                        classNames={{
                          base: "h-full flex-col overflow-auto scrollbar-hide hidden sm:flex",
                          table: "min-h-0",
                          thead: "sticky top-0 z-20 shrink-0",
                          th: "bg-slate-50/90 backdrop-blur-md text-slate-400 font-bold text-xs tracking-wider border-b border-slate-100 h-11 first:rounded-l-none last:rounded-r-none uppercase",
                          tr: "hover:bg-[#67afc3]/5 transition-colors border-b border-slate-50 last:border-none cursor-pointer group",
                          td: "py-3.5 text-sm text-slate-600 font-medium",
                          emptyWrapper: "h-full w-full block",
                        }}
                        bottomContent={
                          items?.length >= 50 && (
                            <div className="flex w-full justify-center p-3 border-t border-slate-100 bg-slate-50/50">
                              <span className="text-xs font-semibold text-slate-400">
                                Mostrando primeros 50 resultados. Afina tu búsqueda.
                              </span>
                            </div>
                          )
                        }
                      >
                        <TableHeader>
                          <TableColumn>CLIENTE</TableColumn>
                          <TableColumn>IDENTIFICACIÓN</TableColumn>
                          <TableColumn>CONTACTO</TableColumn>
                          <TableColumn align="center">ACCIÓN</TableColumn>
                        </TableHeader>
                        <TableBody items={items} loadingState={isLoading || isFetching ? "loading" : "idle"}>
                          {(item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full bg-[#67afc3] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    {item.nombreCompleto?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="group-hover:text-[#67afc3] transition-colors font-semibold truncate max-w-[180px]">
                                    {item.nombreCompleto}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-600 tabular-nums text-xs">
                                  {item.dni || item.cuit || "-"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="truncate max-w-[150px] inline-block text-slate-500 text-xs">
                                  {item.mail || "-"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  className="bg-slate-100 text-slate-600 font-semibold group-hover:bg-[#67afc3] group-hover:text-white transition-all shadow-sm w-full"
                                  onPress={() => { handleSelect(item); onClose(); }}
                                >
                                  Seleccionar
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </div>
              </ModalBody>

              <ModalFooter className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 sm:gap-2">
                {/* Consumidor Final */}
                <Button
                  className="w-full sm:w-auto bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 shrink-0 text-sm h-11 sm:h-10 order-last sm:order-first"
                  size="md"
                  onPress={() => {
                    handleSelect({
                      id: 0,
                      nombre: consumidorFinalSchema.Nombre,
                      apellido: consumidorFinalSchema.Apellido,
                      dni: consumidorFinalSchema.Dni,
                      mail: consumidorFinalSchema.Mail,
                      direccion: consumidorFinalSchema.Direccion,
                      activarCtaCte: false,
                      tieneLimiteCompra: false,
                      montoMaximoCtaCte: 0,
                      saldoActual: 0,
                      margenDisponible: null,
                      ListaPrecioId: null,
                    });
                    onClose();
                  }}
                >
                  Consumidor Final
                </Button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    className="flex-1 sm:flex-none text-slate-500 font-medium hover:bg-slate-100 text-sm h-11 sm:h-10 px-3"
                    variant="light"
                    onPress={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 sm:flex-none bg-[#67afc3] text-white font-semibold shadow-md shadow-[#67afc3]/20 text-sm h-11 sm:h-10 px-3"
                    startContent={<Plus size={16} strokeWidth={2.5} />}
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
