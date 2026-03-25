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
import { LoadingComponent } from "../loading/loading";

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
    <div className="flex-1 rounded-lg border-none">
      <Input
        ref={inputRef}
        classNames={{
          base: "w-full h-12 border-none",
          mainWrapper: "h-full border-none",
          input: "text-small border-none",
          inputWrapper:
            "h-full font-normal text-default-500 bg-transparent outline-none hover:bg-white focus-within:bg-white data-[hover=true]:bg-white rounded-lg border-none shadow-none",
        }}
        placeholder="Escanear (Código / Barras) o Buscar..."
        size="sm"
        // startContent={<ScanBarcode className="text-[#182337]" />}
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handleInputKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        startContent={
          <Button isIconOnly variant="light" size="sm">
            {isSearching ? (
              <Spinner size="sm" className="text-[#67afc3]" color="current" />
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
          className="absolute top-full left-3 right-3 mt-1 z-50"
        >
          <div className="bg-white rounded-xl shadow-lg shadow-slate-200/60 overflow-hidden border border-slate-100">
            <div className="max-h-[350px] overflow-y-auto">
              {suggestions.map((product, index) => (
                <div
                  key={product.Id}
                  className={`
                    px-4 py-3 cursor-pointer transition-all duration-150 border-b border-slate-100 last:border-b-0 flex items-center gap-3
                    ${
                      index === selectedIndex
                        ? "bg-slate-50"
                        : "hover:bg-slate-50/60"
                    }
                  `}
                  onClick={() => handleSelectProduct(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {/* Indicador lateral de selección */}
                  <div
                    className={`w-0.5 self-stretch rounded-full transition-colors ${
                      index === selectedIndex
                        ? "bg-[#67afc3]"
                        : "bg-transparent"
                    }`}
                  />

                  {/* Info del producto */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">
                      {product.Descripcion}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Cód: {product.Codigo}
                      </span>
                      {product.CodigoBarra && (
                        <>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[11px] text-slate-400 font-mono truncate">
                            {product.CodigoBarra}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Datos de precio y stock */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Precios */}
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs text-slate-800 font-semibold">
                        ${product.Precio?.PrecioPublico || 0}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        L2: ${product.Precio?.PrecioPublico2 || 0}
                      </span>
                    </div>

                    {/* Badge de stock */}
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                        product.Stock <= 0
                          ? "bg-red-50 text-red-500"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {product.Stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
