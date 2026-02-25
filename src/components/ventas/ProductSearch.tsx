"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Input,
  Button,
  Spinner,
  Card,
  CardBody,
  addToast,
} from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ScanBarcode } from "lucide-react";
import { fetchProductosVentas } from "@/hooks/useProductos";
import { Producto } from "@/lib/validations/producto.schema";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { parseScaleBarcode } from "@/lib/utils/barcode";

// Simple custom debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
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
  onProductSelect: (p: Producto, cantidad?: number) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Producto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Configuración para báscula
  const { configuracion } = useConfiguracion({ enableConfiguracion: true });

  const debouncedSearch = useDebounceValue(inputValue, 300);

  // Fetch suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearch.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const result = await queryClient.fetchQuery({
          queryKey: ["productos-ventas-suggestions", debouncedSearch.trim()],
          queryFn: ({ signal }) =>
            fetchProductosVentas({
              signal,
              search: debouncedSearch.trim(),
              page: 1,
              limit: 5, // Máximo 5 sugerencias
            }),
          staleTime: 10 * 1000,
        });

        if (result.data && result.data.length > 0) {
          setSuggestions(result.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch, queryClient]);

  // Handle keyboard navigation
  const handleInputKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();

      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        // Seleccionar sugerencia resaltada
        handleSelectProduct(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        const term = inputValue.trim();
        setIsSearching(true);

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
            setIsSearching(false);
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
              setIsSearching(false);
              return;
            }
          }

          if (scaleResult) {
            // Buscar producto por PLU (usando el código parseado)
            // Primero intentamos buscar en cache/remoto por el PLU
            // NOTA: fetchProductosVentas busca por string en codigo, descripcion, etc.
            // Si el PLU es "00123", la búsqueda debería encontrarlo.
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

            // Buscar coincidencia exacta por Codigo (Int) con el PLU
            const pluInt = parseInt(scaleResult.plu, 10);
            const found = result.data.find((p) => p.Codigo === pluInt);

            if (found) {
              // Validar TipoVenta: Si es balanza (peso) y el producto es por UNIDAD -> Error
              if (found.TipoVenta === "UNIDAD") {
                addToast({
                  title: "Producto no pesable",
                  description: `El producto "${found.Descripcion}" se vende por unidad. No se puede ingresar por balanza.`,
                  color: "danger",
                });
                setInputValue("");
                setIsSearching(false);
                return;
              }

              // Calcular cantidad
              let cantidad = 1;
              if (scaleResult.type === "weight") {
                cantidad = scaleResult.value;
              } else if (
                scaleResult.type === "price" &&
                found.Precio?.PrecioPublico
              ) {
                // Si es por precio, calculamos peso = Total / PrecioUnitario
                // Usando PrecioPublico (Lista 1) por defecto
                const price = Number(found.Precio.PrecioPublico);
                if (price > 0) {
                  cantidad = Number((scaleResult.value / price).toFixed(3));
                }
              }

              handleSelectProduct(found, cantidad);
              setIsSearching(false);
              return;
            }
          }

          // 2. Búsqueda normal si no es báscula o no se encontró
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
            // Múltiples coincidencias - mostrar sugerencias
            setSuggestions(result.data);
            setShowSuggestions(true);
          } else {
            // No se encontró nada
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (err) {
          console.error("Error searching product:", err);
        } finally {
          setIsSearching(false);
        }
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectProduct = (product: Producto, cantidad: number = 1) => {
    onProductSelect(product, cantidad);
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex-1 relative rounded-lg border-none">
      <Input
        ref={inputRef}
        classNames={{
          base: "max-w-full sm:max-w-2xl h-12 border-none",
          mainWrapper: "h-full border-none",
          input: "text-small border-none",
          inputWrapper:
            "h-full font-normal text-default-500 bg-white outline-none hover:bg-white focus-within:bg-white data-[hover=true]:bg-white rounded-lg border-none shadow-none",
        }}
        placeholder="Escanear (Código / Barras) o Buscar..."
        size="sm"
        startContent={<ScanBarcode className="text-[#67afc3]" />}
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handleInputKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        endContent={
          <Button isIconOnly variant="light" size="sm">
            {isSearching ? (
              <Spinner size="sm" className="text-[#67afc3]" />
            ) : (
              <Search className="text-[#67afc3]" />
            )}
          </Button>
        }
      />

      {/* Sugerencias debajo del input */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 max-w-full sm:max-w-2xl"
        >
          <Card className="shadow-sm">
            <CardBody className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                {suggestions.map((product, index) => (
                  <div
                    key={product.Id}
                    className={`
                        p-3 cursor-pointer transition-colors border-b border-divider last:border-b-0
                        ${
                          index === selectedIndex
                            ? "bg-primary/10"
                            : "hover:bg-default-100"
                        }
                      `}
                    onClick={() => handleSelectProduct(product)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-default-500 font-mono">
                            {product.Codigo}
                          </span>
                          <span className="text-xs text-default-400">|</span>
                          <span className="text-xs text-default-500 truncate">
                            {product.CodigoBarra}
                          </span>
                        </div>
                        <p className="font-semibold text-sm truncate">
                          {product.Descripcion}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium ${
                              product.Stock <= 0
                                ? "text-danger"
                                : "text-success"
                            }`}
                          >
                            Stock: {product.Stock}
                          </span>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-default-500">
                            L1: ${product.Precio?.PrecioPublico || 0}
                          </span>
                          <span className="text-default-400">|</span>
                          <span className="text-default-500">
                            L2: ${product.Precio?.PrecioPublico2 || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
