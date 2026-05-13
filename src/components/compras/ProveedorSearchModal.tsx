"use client";

import React, { useState } from "react";
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
} from "@heroui/react";
import { Search, Building2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LoadingComponent } from "@/components/loading/loading";
import { ProveedorCompra } from "@/store/useCompraStore";

interface ProveedorSearchModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  handleSelect: (proveedor: ProveedorCompra) => void;
}

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProveedorSearchModal({
  isOpen,
  onOpenChange,
  handleSelect,
}: ProveedorSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounceValue(searchQuery, 400);
  const [items, setItems] = useState<any[]>([]);

  const { isLoading, isFetching } = useQuery({
    queryKey: ["proveedores_modal", debouncedSearch],
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `/api/proveedores?q=${encodeURIComponent(debouncedSearch)}&limit=50`,
        { signal },
      );
      if (!res.ok) return [];
      const data = await res.json();
      setItems(data.data || []);
      return data.data || [];
    },
    enabled: isOpen,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  const emptyState = (
    <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-3 h-full">
      <div className="p-3 bg-slate-50 rounded-full">
        <Search className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-center">
        No se encontraron proveedores
      </p>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      backdrop="opaque"
      motionProps={modalMotionProps}
      classNames={{
        base: "bg-white shadow-2xl border border-slate-200 sm:rounded-[24px] rounded-none m-0 sm:m-auto h-full sm:h-auto sm:max-h-[85vh]",
        header:
          "border-b border-slate-100/60 pb-3 pt-4 sm:pb-4 sm:pt-6 px-4 sm:px-8",
        body: "py-3 sm:py-6 px-3 sm:px-8 flex-1 overflow-hidden flex flex-col",
        footer: "border-t border-slate-100/60 py-3 sm:py-4 px-4 sm:px-8",
        closeButton:
          "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-2.5 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 shadow-sm">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#67afc3]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-800 tracking-tight">
                    Buscador de Proveedores
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">
                    Selecciona el proveedor que emite la factura de esta compra
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody>
              <Input
                placeholder="Buscar por Razón Social, CUIT..."
                startContent={
                  <Search className="text-slate-400 mr-1 sm:mr-2" size={16} />
                }
                value={searchQuery}
                onValueChange={setSearchQuery}
                onClear={() => setSearchQuery("")}
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
                    <LoadingComponent message="Buscando proveedores..." />
                  </div>
                ) : items.length === 0 ? (
                  emptyState
                ) : (
                  <>
                    {/* ── MOBILE CARD LIST ── */}
                    <div className="sm:hidden flex-1 overflow-auto scrollbar-hide divide-y divide-slate-50">
                      {items.map((item: any) => (
                        <button
                          key={item.Id}
                          onClick={() => {
                            handleSelect({
                              Id: Number(item.Id),
                              RazonSocial: item.RazonSocial,
                            });
                            onClose();
                          }}
                          className="w-full px-3 py-3 flex items-center gap-3 hover:bg-[#67afc3]/5 active:bg-[#67afc3]/10 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                            {item.RazonSocial?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-700 text-xs leading-snug line-clamp-1">
                              {item.RazonSocial}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              CUIT: {item.CUIT || "-"}
                            </span>
                          </div>
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-[#67afc3]/10 flex items-center justify-center">
                            <Plus size={16} className="text-[#67afc3]" />
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* ── DESKTOP TABLE ── */}
                    <Table
                      aria-label="Resultados Proveedores"
                      removeWrapper
                      selectionMode="single"
                      onRowAction={(key) => {
                        const selectedItem = items.find(
                          (item: any) => item.Id == key,
                        );
                        if (selectedItem) {
                          handleSelect({
                            Id: Number(selectedItem.Id),
                            RazonSocial: selectedItem.RazonSocial,
                          });
                          onClose();
                        }
                      }}
                      classNames={{
                        base: "h-full flex-col overflow-auto scrollbar-hide hidden sm:flex",
                        table: "min-h-0",
                        thead: "sticky top-0 z-20 shrink-0",
                        th: "bg-slate-50/90 backdrop-blur-md text-slate-400 font-bold text-xs tracking-wider border-b border-slate-100 h-11 first:rounded-l-none last:rounded-r-none uppercase",
                        tr: "hover:bg-[#67afc3]/5 transition-colors border-b border-slate-50 last:border-none cursor-pointer group",
                        td: "py-3.5 text-sm text-slate-600 font-medium",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>RAZÓN SOCIAL</TableColumn>
                        <TableColumn>CUIT</TableColumn>
                        <TableColumn>CONTACTO</TableColumn>
                        <TableColumn align="center">ACCIÓN</TableColumn>
                      </TableHeader>
                      <TableBody
                        items={items}
                        loadingState={
                          isLoading || isFetching ? "loading" : "idle"
                        }
                      >
                        {(item: any) => (
                          <TableRow key={item.Id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                  {item.RazonSocial?.charAt(0).toUpperCase()}
                                </div>
                                <span className="group-hover:text-[#67afc3] transition-colors font-semibold truncate max-w-[200px]">
                                  {item.RazonSocial}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-slate-600 tabular-nums">
                                {item.CUIT || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="truncate max-w-[150px] inline-block text-slate-500 text-xs">
                                {item.Mail || item.Telefono || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                className="bg-slate-100 text-slate-600 font-semibold group-hover:bg-[#67afc3] group-hover:text-white transition-all shadow-sm w-full"
                                onPress={() => {
                                  handleSelect({
                                    Id: Number(item.Id),
                                    RazonSocial: item.RazonSocial,
                                  });
                                  onClose();
                                }}
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

            <ModalFooter className="flex justify-end gap-2">
              <Button
                className="text-slate-500 font-medium hover:bg-slate-100 text-sm h-10 px-4"
                variant="light"
                onPress={onClose}
              >
                Cancelar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
