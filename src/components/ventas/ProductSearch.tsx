"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Input,
  Button,
  Spinner,
  addToast,
} from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ScanBarcode } from "lucide-react";
import { fetchProductosVentas } from "@/hooks/useProductos";
import { Producto } from "@/lib/validations/producto.schema";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { parseScaleBarcode } from "@/lib/utils/barcode";
import CameraScannerModal from "./CameraScannerModal";
import { useVentaStore, OrigenPrecio } from "@/store/ventaStore";

interface ProductSearchProps {
  onProductSelect: (
    p: Producto,
    cantidad?: number,
    precioOverride?: number,
    origenPrecio?: OrigenPrecio,
    ingresadoPorBalanza?: boolean,
  ) => void;
  /** Llamado cuando la bÃºsqueda es ambigua o no hay match exacto.
   *  Recibe los resultados y el tÃ©rmino buscado para que el padre
   *  los muestre en el panel de bÃºsqueda y active la pestaÃ±a correspondiente. */
  onAmbiguousSearch?: (results: Producto[], query: string) => void;
}

export default function ProductSearch({
  onProductSelect,
  onAmbiguousSearch,
}: ProductSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const { listaPrecios } = useVentaStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const isSearchingRef = useRef(false);
  const queryClient = useQueryClient();

  // ConfiguraciÃ³n para bÃ¡scula
  const { configuracion } = useConfiguracion({ enableConfiguracion: true });

  const setSearchingState = (value: boolean) => {
    isSearchingRef.current = value;
    setIsSearching(value);
  };

  const processSearchTerm = async (rawTerm: string) => {
    const term = rawTerm.trim();
    if (!term) {
      // BÃºsqueda vacÃ­a â†’ mostrar panel sin resultados
      onAmbiguousSearch?.([], "");
      return;
    }

    if (isSearchingRef.current) return;

    // â”€â”€ Parsear sintaxis cÃ³digo*precio â”€â”€
    const altPriceMatch = term.match(/^(\d+)\*(\d+\.?\d*)$/);
    if (altPriceMatch) {
      const codigo = altPriceMatch[1];
      const precioAlternativo = parseFloat(altPriceMatch[2]);

      if (precioAlternativo <= 0) {
        addToast({
          title: "Precio invÃ¡lido",
          description: "El precio alternativo debe ser mayor a 0.",
          color: "warning",
        });
        return;
      }

      setSearchingState(true);
      try {
        const result = await queryClient.fetchQuery({
          queryKey: ["productos-ventas-exact", codigo],
          queryFn: ({ signal }) =>
            fetchProductosVentas({
              signal,
              search: codigo,
              page: 1,
              limit: 5,
            }),
          staleTime: 10 * 1000,
        });

        const codigoNum = parseInt(codigo, 10);
        const found = result.data.find((p) => p.Codigo === codigoNum);

        if (found) {
          handleSelectProduct(found, 1, precioAlternativo, "alternativo");
        } else {
          addToast({
            title: "Producto no encontrado",
            description: `No se encontrÃ³ un producto con cÃ³digo ${codigo}.`,
            color: "warning",
          });
        }
      } catch (err) {
        console.error("Error searching product with alt price:", err);
      } finally {
        setSearchingState(false);
      }
      return;
    }

    setSearchingState(true);

    try {
      // 1. Validar si es cÃ³digo de bÃ¡scula pero estÃ¡ desactivada
      if (
        configuracion?.codigoBascula &&
        term.length === 13 &&
        term.startsWith(configuracion.codigoBascula) &&
        !configuracion.activarBascula
      ) {
        addToast({
          title: "BÃ¡scula desactivada",
          description:
            "Se detectÃ³ un cÃ³digo de bÃ¡scula, pero la funciÃ³n estÃ¡ desactivada en la configuraciÃ³n.",
          color: "warning",
        });
        return;
      }

      // 2. Intentar parsear como cÃ³digo de balanza
      let scaleResult = null;
      if (
        configuracion?.activarBascula &&
        configuracion.codigoBascula &&
        term.length === 13 &&
        term.startsWith(configuracion.codigoBascula)
      ) {
        scaleResult = parseScaleBarcode(term, {
          active: true,
          prefix: configuracion.codigoBascula,
          isWeight: configuracion.etiquetaPorPeso ?? false,
          priceDecimals: configuracion.precioDecimales ?? 0,
        });

        if (!scaleResult) {
          addToast({
            title: "Error al leer cÃ³digo",
            description: "No se pudo leer el cÃ³digo de bÃ¡scula.",
            color: "danger",
          });
          return;
        }
      }

      if (scaleResult) {
        // Buscar producto por PLU (usando el cÃ³digo parseado)
        const result = await queryClient.fetchQuery({
          queryKey: ["productos-ventas-scale", scaleResult.plu],
          queryFn: ({ signal }) =>
            fetchProductosVentas({
              signal,
              search: scaleResult.plu,
              page: 1,
              limit: 5,
            }),
          staleTime: 0,
        });

        const pluInt = parseInt(scaleResult.plu, 10);
        const found = result.data.find((p) => p.Codigo === pluInt);

        if (found) {
          let cantidad = 1;

          if (found.TipoVenta === "UNIDAD") {
            cantidad = scaleResult.valueRaw;
            if (cantidad === 0) cantidad = 1;
          } else {
            if (scaleResult.type === "weight") {
              cantidad = scaleResult.value;
            } else if (scaleResult.type === "price") {
              const pl = found.PreciosLista?.find(
                (p) => Number(p.ListaPrecioId) === Number(listaPrecios),
              );
              const price = pl
                ? Number(pl.PrecioFinal)
                : Number(found.PrecioCosto || 0);
              if (price > 0) {
                cantidad = Number((scaleResult.value / price).toFixed(3));
              }
            }
          }

          handleSelectProduct(found, cantidad, undefined, undefined, true);
          return;
        }
      }

      // 3. BÃºsqueda normal si no es bÃ¡scula o no se encontrÃ³
      const isNumeric = /^\d+$/.test(term);

      if (isNumeric) {
        const result = await queryClient.fetchQuery({
          queryKey: ["productos-ventas-exact", term],
          queryFn: ({ signal }) =>
            fetchProductosVentas({
              signal,
              search: term,
              page: 1,
              limit: 5,
            }),
          staleTime: 10 * 1000,
        });

        if (result.data && result.data.length === 1) {
          // Producto exacto encontrado
          handleSelectProduct(result.data[0]);
        } else if (result.data && result.data.length > 1) {
          const codeNum = parseInt(term, 10);
          const exactMatch = result.data.find((p) => p.Codigo === codeNum);
          if (exactMatch) {
            handleSelectProduct(exactMatch);
          } else {
            // MÃºltiples sin cÃ³digo exacto â†’ panel de bÃºsqueda
            onAmbiguousSearch?.(result.data, term);
          }
        } else {
          // Sin coincidencias â†’ buscar con mÃ¡s resultados y mostrar en panel
          const broadResult = await queryClient.fetchQuery({
            queryKey: ["productos-ventas-ambiguous", term],
            queryFn: ({ signal }) =>
              fetchProductosVentas({
                signal,
                search: term,
                page: 1,
                limit: 50,
              }),
            staleTime: 10 * 1000,
          });
          onAmbiguousSearch?.(broadResult.data, term);
        }
      } else {
        // Contiene letras â†’ buscar y mostrar en panel
        const result = await queryClient.fetchQuery({
          queryKey: ["productos-ventas-text", term],
          queryFn: ({ signal }) =>
            fetchProductosVentas({
              signal,
              search: term,
              page: 1,
              limit: 50,
            }),
          staleTime: 10 * 1000,
        });
        onAmbiguousSearch?.(result.data, term);
      }
    } catch (err) {
      console.error("Error searching product:", err);
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

  // Al cerrarse el escÃ¡ner, reafirmar foco en el input
  useEffect(() => {
    if (!isScannerOpen) {
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [isScannerOpen]);

  const handleSelectProduct = (
    product: Producto,
    cantidad: number = 1,
    precioOverride?: number,
    origenPrecio?: OrigenPrecio,
    ingresadoPorBalanza?: boolean,
  ) => {
    onProductSelect(product, cantidad, precioOverride, origenPrecio, ingresadoPorBalanza);
    setInputValue("");
    if (!isScannerOpen) {
      inputRef.current?.focus();
    }
  };

  const handleCameraScan = async (decodedText: string) => {
    await processSearchTerm(decodedText);
  };

  return (
    <div className="flex-1 h-10 relative">
      <Input
        ref={inputRef}
        id="product-search-input"
        classNames={{
          base: "w-full h-10",
          mainWrapper: "h-full",
          input: "text-xs",
          inputWrapper:
            "h-10 min-h-[40px] font-normal text-default-500 bg-white outline-none hover:border-[#67afc3] focus-within:border-[#67afc3] data-[hover=true]:bg-white rounded-lg border border-slate-300 shadow-none transition-colors",
        }}
        placeholder="CÃ³digo, nombre o cÃ³digo*precio (ej: 2*350)"
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
            title="Escanear con cÃ¡mara"
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
