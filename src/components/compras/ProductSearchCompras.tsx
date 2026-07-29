"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input, Button, Spinner } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ScanBarcode } from "lucide-react";
import { fetchProductosCompras } from "@/hooks/useProductos";
import { Producto } from "@/lib/validations/producto.schema";
import CameraScannerModal from "@/components/ventas/CameraScannerModal";

/**
 * Buscador de productos para COMPRAS.
 * Usa /api/compras/productos que incluye PrecioCosto en la respuesta.
 * La firma de onProductSelect es intencionalmente compatible con ProductSearch
 * de ventas para facilitar reutilización de componentes.
 */
export default function ProductSearchCompras({
  onProductSelect,
  onAmbiguousSearch,
}: {
  onProductSelect: (p: Producto, cantidad?: number) => void;
  /** Llamado cuando la búsqueda es ambigua o no hay match exacto.
   *  Recibe los resultados y el término buscado para que el padre
   *  los muestre en el panel de búsqueda. */
  onAmbiguousSearch?: (results: Producto[], query: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const isSearchingRef = useRef(false);
  const queryClient = useQueryClient();

  const setSearchingState = (value: boolean) => {
    isSearchingRef.current = value;
    setIsSearching(value);
  };

  const processSearchTerm = async (rawTerm: string) => {
    const term = rawTerm.trim();
    if (!term) {
      onAmbiguousSearch?.([], "");
      return;
    }

    if (isSearchingRef.current) return;

    setSearchingState(true);
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
          const exactMatch = result.data.find((p) => p.Codigo === codeNum);
          if (exactMatch) {
            handleSelectProduct(exactMatch);
            return;
          }
          // Múltiples sin código exacto → panel de búsqueda
          onAmbiguousSearch?.(result.data, term);
          return;
        }

        // Sin coincidencias → buscar con más resultados y mostrar en panel
        const broadResult = await queryClient.fetchQuery({
          queryKey: ["productos-compras-ambiguous", term],
          queryFn: ({ signal }) =>
            fetchProductosCompras({ signal, search: term, page: 1, limit: 50 }),
          staleTime: 10_000,
        });
        onAmbiguousSearch?.(broadResult.data, term);
      } else {
        // Contiene letras → buscar y mostrar en panel
        const result = await queryClient.fetchQuery({
          queryKey: ["productos-compras-text", term],
          queryFn: ({ signal }) =>
            fetchProductosCompras({ signal, search: term, page: 1, limit: 50 }),
          staleTime: 10_000,
        });
        onAmbiguousSearch?.(result.data, term);
      }
    } catch (err) {
      console.error("Error al buscar producto:", err);
    } finally {
      setSearchingState(false);
    }
  };

  const handleInputKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await processSearchTerm(inputValue);
      setInputValue("");
    }
  };

  // Al cerrarse el escáner, reafirmar foco en el input
  useEffect(() => {
    if (!isScannerOpen) {
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [isScannerOpen]);

  const handleSelectProduct = (product: Producto, cantidad: number = 1) => {
    onProductSelect(product, cantidad);
    setInputValue("");
    if (!isScannerOpen) inputRef.current?.focus();
  };

  const handleCameraScan = async (decodedText: string) => {
    await processSearchTerm(decodedText);
  };

  return (
    <div className="flex-1 h-10 relative">
      <Input
        ref={inputRef}
        id="product-search-compras-input"
        classNames={{
          base: "w-full h-10",
          mainWrapper: "h-full",
          input: "text-xs",
          inputWrapper:
            "h-10 min-h-[40px] font-normal text-default-500 bg-white outline-none hover:border-[#67afc3] focus-within:border-[#67afc3] data-[hover=true]:bg-white rounded-lg border border-slate-300 shadow-none transition-colors",
        }}
        placeholder="Código o nombre del producto (Enter para buscar)"
        size="sm"
        autoFocus
        value={inputValue}
        onValueChange={(value) => {
          if (isSearchingRef.current) return;
          setInputValue(value);
        }}
        onKeyDown={handleInputKeyDown}
        startContent={
          <Button
            isIconOnly
            variant="light"
            size="sm"
            isDisabled={isSearching}
            onPress={() => {
              processSearchTerm(inputValue);
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
            isDisabled={isSearching}
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
    </div>
  );
}
