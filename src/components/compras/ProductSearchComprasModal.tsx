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
} from "@heroui/react";
import { Search, Package, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchProductosCompras } from "@/hooks/useProductos";
import { Producto } from "@/lib/validations/producto.schema";
import { LoadingComponent } from "@/components/loading/loading";

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;
  initialSearch: string;
  handleSelect: (product: Producto, cantidad?: number) => void;
}

export default function ProductSearchComprasModal({
  isOpen,
  onOpenChange,
  initialSearch,
  handleSelect,
}: Props) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearch = useDebounceValue(searchQuery, 300);

  useEffect(() => {
    if (isOpen) setSearchQuery(initialSearch);
  }, [isOpen, initialSearch]);

  const {
    data: queryResult,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["productos_compras_modal", debouncedSearch],
    queryFn: async ({ signal }) => {
      if (!debouncedSearch.trim()) return { data: [], meta: { total: 0 } };
      return fetchProductosCompras({
        signal,
        search: debouncedSearch.trim(),
        page: 1,
        limit: 50,
      });
    },
    enabled: isOpen && debouncedSearch.trim().length > 0,
    staleTime: 10_000,
  });

  const items = queryResult?.data || [];

  const emptyState = (
    <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-3 h-full">
      <div className="p-3 bg-slate-50 rounded-full">
        <Search className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-center">
        {searchQuery.length < 2
          ? "Ingresa al menos 2 caracteres para buscar"
          : "No se encontraron productos"}
      </p>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="4xl"
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
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#67afc3]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-800 tracking-tight">
                    Buscador de Productos
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">
                    Selecciona un producto para agregarlo a la compra
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody>
              <Input
                placeholder="Buscar por Nombre, Código..."
                startContent={
                  <Search className="text-slate-400 mr-1 sm:mr-2" size={16} />
                }
                value={searchQuery}
                onValueChange={setSearchQuery}
                onClear={() => setSearchQuery("")}
                autoFocus
                classNames={{
                  inputWrapper:
                    "bg-slate-50 hover:bg-slate-100 focus-within:!bg-white border-2 border-transparent focus-within:!border-[#67afc3]/40 transition-all shadow-sm rounded-xl h-11 sm:h-14",
                  input: "text-slate-700 font-medium text-sm sm:text-[15px]",
                  clearButton: "text-slate-400",
                }}
              />

              <div className="flex-1 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm relative flex flex-col mt-2 min-h-0 sm:h-[350px] sm:flex-none">
                {isLoading || isFetching ? (
                  <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50/50">
                    <LoadingComponent message="Buscando productos..." />
                  </div>
                ) : items.length === 0 ? (
                  emptyState
                ) : (
                  <>
                    {/* ── MOBILE ── */}
                    <div className="sm:hidden flex-1 overflow-auto scrollbar-hide divide-y divide-slate-50">
                      {items.map((item: Producto) => (
                        <button
                          key={item.Id}
                          onClick={() => {
                            handleSelect(item);
                            onClose();
                          }}
                          className="w-full px-3 py-3 flex items-center gap-3 hover:bg-[#67afc3]/5 active:bg-[#67afc3]/10 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="font-semibold text-slate-700 text-xs leading-snug line-clamp-2">
                              {item.Descripcion}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Cód: {item.Codigo}
                            </span>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-amber-600">
                              Costo: $
                              {Number(item.PrecioCosto ?? 0).toLocaleString(
                                "es-AR",
                                { minimumFractionDigits: 2 },
                              )}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.Stock <= 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                            >
                              Stock: {item.Stock}
                            </span>
                          </div>
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-[#67afc3]/10 flex items-center justify-center">
                            <Plus size={16} className="text-[#67afc3]" />
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* ── DESKTOP ── */}
                    <Table
                      aria-label="Resultados Productos Compras"
                      removeWrapper
                      selectionMode="single"
                      onRowAction={(key) => {
                        const selected = items.find(
                          (item: Producto) => item.Id == key,
                        );
                        if (selected) {
                          handleSelect(selected);
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
                        <TableColumn>PRODUCTO</TableColumn>
                        <TableColumn>CÓDIGOS</TableColumn>
                        <TableColumn align="end">COSTO ACTUAL</TableColumn>
                        <TableColumn align="center">STOCK</TableColumn>
                        <TableColumn align="center">ACCIÓN</TableColumn>
                      </TableHeader>
                      <TableBody
                        items={items}
                        loadingState={
                          isLoading || isFetching ? "loading" : "idle"
                        }
                      >
                        {(item: Producto) => (
                          <TableRow key={item.Id}>
                            <TableCell>
                              <span className="group-hover:text-[#67afc3] transition-colors font-semibold truncate max-w-[250px] inline-block">
                                {item.Descripcion}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-slate-600 text-[11px] font-mono">
                                  Cód: {item.Codigo}
                                </span>
                                {item.CodigoBarra && (
                                  <span className="text-slate-400 text-[10px] font-mono">
                                    CB: {item.CodigoBarra}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-amber-600 text-sm">
                                $
                                {Number(item.PrecioCosto ?? 0).toLocaleString(
                                  "es-AR",
                                  { minimumFractionDigits: 2 },
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <span
                                  className={`text-[12px] font-bold px-2 py-1 rounded-md ${item.Stock <= 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                                >
                                  {item.Stock}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                className="bg-slate-100 text-slate-600 font-semibold group-hover:bg-[#67afc3] group-hover:text-white transition-all shadow-sm w-full"
                                onPress={() => {
                                  handleSelect(item);
                                  onClose();
                                }}
                              >
                                Agregar
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

            <ModalFooter>
              <Button
                className="text-slate-500 font-medium hover:bg-slate-100"
                variant="light"
                onPress={onClose}
              >
                Cerrar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
