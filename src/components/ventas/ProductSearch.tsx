"use client";

import React, { useState, useRef } from "react";
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
import ProductSearchModal from "./ProductSearchModal";
import { useVentaStore, OrigenPrecio } from "@/store/ventaStore";

export default function ProductSearch({
  onProductSelect,
}: {
  onProductSelect: (p: Producto, cantidad?: number, precioOverride?: number, origenPrecio?: OrigenPrecio) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Estado para el modal de búsqueda
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTermForModal, setSearchTermForModal] = useState("");
  const { listaPrecios } = useVentaStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const isSearchingRef = useRef(false);
  const queryClient = useQueryClient();

  // Configuración para báscula
  const { configuracion } = useConfiguracion({ enableConfiguracion: true });

  const setSearchingState = (value: boolean) => {
    isSearchingRef.current = value;
    setIsSearching(value);
  };

  const handleInputKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (isSearchingRef.current) return;

      if (inputValue.trim()) {
        const term = inputValue.trim();

        // ── Parsear sintaxis código*precio ──
        const altPriceMatch = term.match(/^(\d+)\*(\d+\.?\d*)$/);
        if (altPriceMatch) {
          const codigo = altPriceMatch[1];
          const precioAlternativo = parseFloat(altPriceMatch[2]);

          if (precioAlternativo <= 0) {
            addToast({
              title: "Precio inválido",
              description: "El precio alternativo debe ser mayor a 0.",
              color: "warning",
            });
            setInputValue("");
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
                description: `No se encontró un producto con código ${codigo}.`,
                color: "warning",
              });
            }
          } catch (err) {
            console.error("Error searching product with alt price:", err);
          } finally {
            setSearchingState(false);
          }
          setInputValue("");
          return;
        }

        setSearchingState(true);

        try {
          // 1. Validar si es código de báscula pero está desactivada
          if (
            configuracion?.codigoBascula &&
            term.length === 13 &&
            term.startsWith(configuracion.codigoBascula) &&
            !configuracion.activarBascula
          ) {
            addToast({
              title: "Báscula desactivada",
              description:
                "Se detectó un código de báscula, pero la función está desactivada en la configuración.",
              color: "warning",
            });
            setInputValue("");
            return;
          }

          // 2. Intentar parsear como código de balanza
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
                title: "Error al leer código",
                description: "No se pudo leer el código de báscula.",
                color: "danger",
              });
              setInputValue("");
              return;
            }
          }

          if (scaleResult) {
            // Buscar producto por PLU (usando el código parseado)
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
              if (found.TipoVenta === "UNIDAD") {
                addToast({
                  title: "Producto no pesable",
                  description: `El producto "${found.Descripcion}" se vende por unidad. No se puede ingresar por balanza.`,
                  color: "danger",
                });
                setInputValue("");
                return;
              }

              let cantidad = 1;
              if (scaleResult.type === "weight") {
                cantidad = scaleResult.value;
              } else if (scaleResult.type === "price") {
                const pl = found.PreciosLista?.find(p => Number(p.ListaPrecioId) === Number(listaPrecios));
                const price = pl ? Number(pl.PrecioFinal) : Number(found.PrecioCosto || 0);
                if (price > 0) {
                  cantidad = Number((scaleResult.value / price).toFixed(3));
                }
              }

              handleSelectProduct(found, cantidad);
              return;
            }
          }

          // 3. Búsqueda normal si no es báscula o no se encontró
          // Verificar si el término contiene solo números
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
              // Producto exacto encontrado (ej. código exacto o código de barras)
              handleSelectProduct(result.data[0]);
            } else if (result.data && result.data.length > 1) {
              // Verificar si el primer resultado es coincidencia exacta por código
              const codeNum = parseInt(term, 10);
              const exactMatch = result.data.find((p) => p.Codigo === codeNum);
              if (exactMatch) {
                handleSelectProduct(exactMatch);
              } else {
                // Múltiples coincidencias sin código exacto -> Abrir Modal
                setSearchTermForModal(term);
                setIsSearchModalOpen(true);
                setInputValue("");
              }
            } else {
              // Sin coincidencias -> Abrir Modal
              setSearchTermForModal(term);
              setIsSearchModalOpen(true);
              setInputValue("");
            }
          } else {
            // Contiene letras u otros caracteres, abrir el modal directamente
            setSearchTermForModal(term);
            setIsSearchModalOpen(true);
            setInputValue("");
          }
        } catch (err) {
          console.error("Error searching product:", err);
        } finally {
          setSearchingState(false);
        }
      } else {
        // Input vacío -> Abrir Modal para que busque manualmente
        setSearchTermForModal("");
        setIsSearchModalOpen(true);
      }
    }
  };

  const handleSelectProduct = (product: Producto, cantidad: number = 1, precioOverride?: number, origenPrecio?: OrigenPrecio) => {
    onProductSelect(product, cantidad, precioOverride, origenPrecio);
    setInputValue("");
    if (!isScannerOpen) {
      inputRef.current?.focus();
    }
  };

  const handleCameraScan = async (decodedText: string) => {
    if (isSearchingRef.current) return;

    setSearchingState(true);
    try {
      const term = decodedText.trim();
      const result = await queryClient.fetchQuery({
        queryKey: ["productos-ventas-exact", term],
        queryFn: ({ signal }) => fetchProductosVentas({
          signal, search: term, page: 1, limit: 5
        }),
        staleTime: 10 * 1000
      });

      if (result.data && result.data.length > 0) {
        // Enviar el primer producto coincidente
        handleSelectProduct(result.data[0]);
      } else {
        addToast({
          title: "Código no encontrado",
          description: `No se encontró el producto ${term}`,
          color: "warning"
        });
      }
    } catch (err) {
      console.error("Error al buscar producto escaneado:", err);
      addToast({
        title: "Error",
        description: "Error al buscar el producto escaneado",
        color: "danger"
      });
    } finally {
      setSearchingState(false);
    }
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
        placeholder="Código, nombre o código*precio (ej: 2*350)"
        size="sm"
        autoFocus
        isDisabled={isSearching}
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

      <ProductSearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={() => setIsSearchModalOpen(false)}
        initialSearch={searchTermForModal}
        handleSelect={handleSelectProduct}
      />
    </div>
  );
}

