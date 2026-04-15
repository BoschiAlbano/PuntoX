"use client";

import React, { useState, useRef } from "react";
import { Input, Button, Spinner, addToast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ScanBarcode } from "lucide-react";
import { fetchProductosCompras } from "@/hooks/useProductos";
import { Producto } from "@/lib/validations/producto.schema";
import CameraScannerModal from "@/components/ventas/CameraScannerModal";
import ProductSearchComprasModal from "./ProductSearchComprasModal";

/**
 * Buscador de productos para COMPRAS.
 * Usa /api/compras/productos que incluye PrecioCosto en la respuesta.
 * La firma de onProductSelect es intencionalmente compatible con ProductSearch
 * de ventas para facilitar reutilización de componentes.
 */
export default function ProductSearchCompras({
  onProductSelect,
}: {
  onProductSelect: (p: Producto, cantidad?: number) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTermForModal, setSearchTermForModal] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleInputKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const term = inputValue.trim();

    if (!term) {
      setSearchTermForModal("");
      setIsSearchModalOpen(true);
      return;
    }

    setIsSearching(true);
    try {
      const isNumeric = /^\d+$/.test(term);

      if (isNumeric) {
        const result = await queryClient.fetchQuery({
          queryKey: ["productos-compras-exact", term],
          queryFn: ({ signal }) =>
            fetchProductosCompras({ signal, search: term, page: 1, limit: 5 }),
          staleTime: 10_000,
        });

        if (result.data && result.data.length === 1) {
          handleSelectProduct(result.data[0]);
          return;
        }

        if (result.data && result.data.length > 1) {
          const codeNum = parseInt(term, 10);
          const exact = result.data.find((p) => p.Codigo === codeNum);
          if (exact) {
            handleSelectProduct(exact);
            return;
          }
        }
      }

      // Si no puede resolver directamente → abrir modal
      setSearchTermForModal(term);
      setIsSearchModalOpen(true);
      setInputValue("");
    } catch (err) {
      console.error("Error al buscar producto:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: Producto, cantidad: number = 1) => {
    onProductSelect(product, cantidad);
    setInputValue("");
    if (!isScannerOpen) inputRef.current?.focus();
  };

  const handleCameraScan = async (decodedText: string) => {
    setIsSearching(true);
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ["productos-compras-exact", decodedText],
        queryFn: ({ signal }) =>
          fetchProductosCompras({ signal, search: decodedText, page: 1, limit: 5 }),
        staleTime: 10_000,
      });

      if (result.data && result.data.length > 0) {
        handleSelectProduct(result.data[0]);
      } else {
        addToast({
          title: "Código no encontrado",
          description: `No se encontró el producto ${decodedText}`,
          color: "warning",
        });
      }
    } catch {
      addToast({ title: "Error", description: "Error al buscar el producto escaneado", color: "danger" });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 rounded-lg border-none h-10 relative">
      <Input
        ref={inputRef}
        classNames={{
          base: "w-full h-10 border-none",
          mainWrapper: "h-full border-none",
          input: "text-xs border-none",
          inputWrapper:
            "h-10 min-h-[40px] font-normal text-default-500 bg-transparent outline-none hover:bg-white focus-within:bg-white data-[hover=true]:bg-white rounded-lg border-none shadow-none",
        }}
        placeholder="Código o nombre del producto (Enter para buscar)"
        size="sm"
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handleInputKeyDown}
        startContent={
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => {
              setSearchTermForModal(inputValue);
              setIsSearchModalOpen(true);
              setInputValue("");
            }}
          >
            {isSearching ? (
              <Spinner size="sm" className="text-[#67afc3]" color="current" />
            ) : (
              <Search className="text-[#67afc3] hover:text-[#5293a5] transition-colors" />
            )}
          </Button>
        }
        endContent={
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setIsScannerOpen(true)}
            title="Escanear con cámara"
          >
            <ScanBarcode className="text-slate-400 hover:text-[#67afc3] transition-colors" size={18} />
          </Button>
        }
      />

      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleCameraScan}
      />

      <ProductSearchComprasModal
        isOpen={isSearchModalOpen}
        onOpenChange={() => setIsSearchModalOpen(false)}
        initialSearch={searchTermForModal}
        handleSelect={handleSelectProduct}
      />
    </div>
  );
}
