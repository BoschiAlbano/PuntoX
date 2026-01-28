"use client";

import React, { useState, useRef } from "react";
import {
  Input,
  Button,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
} from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ScanBarcode } from "lucide-react";
import { useProductosVentas, fetchProductosVentas } from "@/hooks/useProductos";
import { Producto } from "@/lib/validations/producto.schema";

// Simple custom debounce hook if uidotdev is not available or to be safe
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ProductSearch({
  onProductSelect,
}: {
  onProductSelect: (p: Producto) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [isSearching, setIsSearching] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const queryClient = useQueryClient();

  // Search state for Modal
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounceValue(searchQuery, 500);

  // Query for Modal List
  // Query for Modal List
  const { data, isLoading, isFetching } = useProductosVentas({
    search: debouncedSearch,
    page,
    enabled: isOpen,
  });

  const handleInputKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      setIsSearching(true);
      // Search by specific code/barcode directly
      // Search by specific code/barcode directly
      try {
        const result = await queryClient.fetchQuery({
          queryKey: ["productos-ventas", inputValue.trim(), 1],
          queryFn: ({ signal }) =>
            fetchProductosVentas({
              signal,
              search: inputValue.trim(),
              page: 1,
              limit: 5,
            }),
          staleTime: 10 * 1000,
        });

        console.log("api: ", result.data);

        if (result.data && result.data.length === 1) {
          const product = result.data[0];
          onProductSelect(product);
          setInputValue("");
        } else if (result.data && result.data.length > 1) {
          // Multiple matches (rare for exact code, but possible inc/ insensitive) -> Open Modal with pre-filled
          setSearchQuery(inputValue);
          onOpen();
        } else {
          // No match
          // Maybe sound alert or toast
          // For now, open modal ensuring user sees no results
          setSearchQuery(inputValue);
          onOpen();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleManualSearch = () => {
    setSearchQuery(inputValue);
    onOpen();
  };

  return (
    <>
      <div className="flex gap-2 w-full">
        <Input
          ref={inputRef}
          classNames={{
            base: "max-w-full sm:max-w-2xl h-12",
            mainWrapper: "h-full",
            input: "text-small",
            inputWrapper:
              "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20",
          }}
          placeholder="Escanear (Código / Barras) o Buscar..."
          size="lg"
          startContent={<ScanBarcode className="text-[#67afc3]" />}
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={handleInputKeyDown}
          endContent={
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={handleManualSearch}
            >
              {isSearching ? (
                <Spinner size="sm" className="text-[#67afc3]" />
              ) : (
                <Search className="text-[#67afc3] " />
              )}
            </Button>
          }
        />
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Buscar Producto
              </ModalHeader>
              <ModalBody>
                <Input
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  placeholder="Escriba para buscar..."
                  startContent={<Search className="w-4 h-4 text-gray-400" />}
                  autoFocus
                  onClear={() => setSearchQuery("")}
                />

                <div className="min-h-[300px] flex flex-col">
                  <Table
                    aria-label="Resultados de búsqueda"
                    className="h-full"
                    bottomContent={
                      data?.meta && (
                        <div className="flex w-full justify-center">
                          <Pagination
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            page={page}
                            total={data.meta.totalPages}
                            onChange={(page) => setPage(page)}
                          />
                        </div>
                      )
                    }
                  >
                    <TableHeader>
                      <TableColumn>CODIGO</TableColumn>
                      <TableColumn>DESCRIPCION</TableColumn>
                      <TableColumn>STOCK</TableColumn>
                      <TableColumn>PRECIO LISTA 1</TableColumn>
                      <TableColumn>PRECIO LISTA 2</TableColumn>
                      <TableColumn>ACCION</TableColumn>
                    </TableHeader>
                    <TableBody
                      items={data?.data || []}
                      loadingContent={<Spinner />}
                      loadingState={
                        isLoading || isFetching ? "loading" : "idle"
                      }
                      emptyContent={"No se encontraron productos"}
                    >
                      {(item: any) => (
                        <TableRow key={item.Id}>
                          <TableCell>{item.Codigo}</TableCell>
                          <TableCell className="font-bold">
                            {item.Descripcion}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                item.Stock <= 0 ? "text-danger" : "text-success"
                              }
                            >
                              {item.Stock}
                            </span>
                          </TableCell>
                          <TableCell>${item.Precio?.PrecioPublico}</TableCell>
                          <TableCell>${item.Precio?.PrecioPublico2}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              color="primary"
                              onPress={() => {
                                onProductSelect(item);
                                onClose();
                                setInputValue("");
                                setSearchQuery("");
                              }}
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
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
