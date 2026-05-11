"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Modal,
  ModalContent,
  ModalBody,
  Input,
  Spinner,
} from "@heroui/react";
import {
  Search,
  Home,
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  PieChart,
  Settings,
  ChevronRight,
  MonitorPlay,
  FileText,
  UserCircle,
  Tag,
  Building2,
  Box,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ItemType = "page" | "product" | "client";

interface SearchItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  href?: string;
  data?: any;
}

const STATIC_PAGES: SearchItem[] = [
  { id: "p-dash", type: "page", title: "Dashboard", subtitle: "Inicio", icon: Home, href: "/dashboard" },
  { id: "p-pos", type: "page", title: "Punto de Venta (POS)", subtitle: "Nueva Venta", icon: ShoppingCart, href: "/ventas" },
  { id: "p-caja", type: "page", title: "Caja Activa", subtitle: "Operaciones de caja", icon: DollarSign, href: "/caja" },
  { id: "p-prod", type: "page", title: "Productos", subtitle: "Gestión de inventario", icon: Package, href: "/productos" },
  { id: "p-marcas", type: "page", title: "Marcas", subtitle: "Gestión de marcas", icon: Tag, href: "/productos/marcas" },
  { id: "p-rubros", type: "page", title: "Rubros", subtitle: "Categorías de productos", icon: Box, href: "/productos/rubros" },
  { id: "p-listas", type: "page", title: "Listas de Precios", subtitle: "Gestión de listas de precios", icon: DollarSign, href: "/productos/listas-precios" },
  { id: "p-client", type: "page", title: "Clientes", subtitle: "Gestión de clientes y Cta. Cte.", icon: Users, href: "/clientes" },
  { id: "p-analit", type: "page", title: "Analíticas", subtitle: "Métricas y reportes", icon: PieChart, href: "/analiticas" },
  { id: "p-empleados", type: "page", title: "Empleados", subtitle: "Personal y Roles", icon: UserCircle, href: "/empleados" },
  { id: "p-sucursal", type: "page", title: "Sucursales", subtitle: "Gestión de locales", icon: Building2, href: "/sucursales" },
  { id: "p-config", type: "page", title: "Configuración", subtitle: "Ajustes del sistema", icon: Settings, href: "/configuracion" },
];

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Product Search Query
  const { data: productsData, isFetching: isFetchingProducts } = useQuery({
    queryKey: ["global-search-products", debouncedQuery],
    queryFn: async ({ signal }) => {
      if (debouncedQuery.length < 2) return [];
      const res = await fetch(`/api/ventas/productos?q=${encodeURIComponent(debouncedQuery)}&limit=5`, { signal });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: isOpen && debouncedQuery.length >= 2,
    staleTime: 60000,
  });

  // Client Search Query
  const { data: clientsData, isFetching: isFetchingClients } = useQuery({
    queryKey: ["global-search-clients", debouncedQuery],
    queryFn: async ({ signal }) => {
      if (debouncedQuery.length < 2) return [];
      const res = await fetch(`/api/ventas/clientes?q=${encodeURIComponent(debouncedQuery)}`, { signal });
      if (!res.ok) return [];
      const json = await res.json();
      // limit to 5 manually if endpoint doesn't support limit
      return Array.isArray(json) ? json.slice(0, 5) : [];
    },
    enabled: isOpen && debouncedQuery.length >= 2,
    staleTime: 60000,
  });

  // Compile full items list
  const items = useMemo(() => {
    let result: SearchItem[] = [];

    // Filter static pages
    const lowerQ = debouncedQuery.toLowerCase();
    const filteredPages = STATIC_PAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQ) ||
        p.subtitle?.toLowerCase().includes(lowerQ)
    );
    result.push(...filteredPages.slice(0, 5)); // max 5 pages

    // Format and append products
    if (productsData && productsData.length > 0) {
      const prodItems: SearchItem[] = productsData.map((p: any) => ({
        id: `prod-${p.Id}`,
        type: "product",
        title: p.Descripcion,
        subtitle: `Cód: ${p.Codigo || p.CodigoBarra} • Stock: ${p.Stock}`,
        icon: Package,
        data: p,
      }));
      result.push(...prodItems);
    }

    // Format and append clients
    if (clientsData && clientsData.length > 0) {
      const clientItems: SearchItem[] = clientsData.map((c: any) => ({
        id: `client-${c.id}`,
        type: "client",
        title: c.nombreCompleto || `${c.nombre} ${c.apellido || ""}`.trim(),
        subtitle: `ID/DNI: ${c.dni || c.cuit || "-"} • Email: ${c.mail || "-"}`,
        icon: UserCircle,
        data: c,
      }));
      result.push(...clientItems);
    }

    // Give some default results if query is empty
    if (!debouncedQuery) {
      result = STATIC_PAGES.slice(0, 5);
    }

    return result;
  }, [debouncedQuery, productsData, clientsData]);

  // Adjust selected index if it goes out of bounds
  useEffect(() => {
    if (selectedIndex >= items.length && items.length > 0) {
      setSelectedIndex(0);
    }
  }, [items.length, selectedIndex]);

  // Handle Selection
  const handleSelect = (item: SearchItem) => {
    if (item.type === "page" && item.href) {
      router.push(item.href);
    } else if (item.type === "product") {
      // Navegar a productos buscando el código exacto y abrir el modal
      router.push(`/productos?q=${encodeURIComponent(item.data.Codigo || item.data.Descripcion)}&editId=${item.data.Id}`);
    } else if (item.type === "client") {
      // Navegar a clientes y abrir el modal
      const searchDni = item.data.dni || item.data.cuit;
      if (searchDni) {
        router.push(`/clientes?q=${encodeURIComponent(searchDni)}&editId=${item.data.id}`);
      } else {
        router.push(`/clientes?editId=${item.data.id}`);
      }
    }
    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
      scrollToItem((selectedIndex + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      scrollToItem((selectedIndex - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[selectedIndex];
      if (item) {
        handleSelect(item);
      }
    }
  };

  const scrollToItem = (index: number) => {
    if (listRef.current) {
      const children = listRef.current.children;
      if (children[index]) {
        (children[index] as HTMLElement).scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  };

  const isFetching = isFetchingProducts || isFetchingClients;

  // Group items by type for rendering headers
  let currentGroup = "";

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="2xl"
      backdrop="blur"
      placement="center"
      hideCloseButton
      classNames={{
        base: "bg-white/95 backdrop-blur-3xl shadow-2xl border border-white/60 rounded-[20px] overflow-hidden",
        body: "p-0",
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.2, ease: "easeOut" },
          },
          exit: {
            y: 20,
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.15, ease: "easeIn" },
          },
        },
      }}
    >
      <ModalContent>
        <ModalBody>
          <div className="flex items-center px-4 py-3 pb-2 border-b border-slate-100/80 gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              autoFocus
              placeholder="Buscar secciones, productos, clientes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full bg-transparent border-none outline-none text-[15px] font-medium text-slate-700 placeholder:text-slate-400"
            />
            {isFetching && (
              <Spinner size="sm" color="current" className="text-[#67afc3]" />
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-mono font-medium border border-slate-200">
              ESC
            </kbd>
          </div>

          <div
            className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide"
            ref={listRef}
          >
            {items.length === 0 && !isFetching && debouncedQuery.length >= 2 ? (
              <div className="py-12 px-6 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">
                  No encontramos resultados para "{query}"
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Intenta buscar con otros términos
                </p>
              </div>
            ) : items.length === 0 && !isFetching && debouncedQuery.length > 0 && debouncedQuery.length < 2 ? (
               <div className="py-6 px-4 text-center">
                 <p className="text-slate-500 text-sm">Escribe al menos 2 caracteres para buscar en base de datos...</p>
               </div>
            ) : (
              items.map((item, index) => {
                const isSelected = index === selectedIndex;
                const showGroupHeader = item.type !== currentGroup;
                if (showGroupHeader) {
                  currentGroup = item.type;
                }

                // Get type label
                let typeLabel = "Navegación";
                if (item.type === "product") typeLabel = "Artículos / Productos";
                if (item.type === "client") typeLabel = "Clientes";

                return (
                  <React.Fragment key={item.id}>
                    {showGroupHeader && (
                      <div className="px-3 py-1.5 mt-2 mb-1 first:mt-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {typeLabel}
                        </span>
                      </div>
                    )}
                    <button
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group outline-none
                        ${
                          isSelected
                            ? "bg-[#67afc3]/10 text-[#67afc3]"
                            : "hover:bg-slate-50 text-slate-600"
                        }
                      `}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors
                            ${
                              isSelected
                                ? "bg-[#67afc3] text-white"
                                : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                            }
                          `}
                        >
                          {item.icon && <item.icon size={16} strokeWidth={2.5} />}
                        </div>
                        <div className="flex flex-col min-w-0 pr-4">
                          <span
                            className={`font-semibold text-[14px] leading-tight truncate
                              ${isSelected ? "text-[#67afc3]" : "text-slate-800"}
                            `}
                          >
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span
                              className={`text-[12px] mt-0.5 truncate leading-tight
                                ${isSelected ? "text-[#67afc3]/80" : "text-slate-500"}
                              `}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isSelected ? (
                        <div className="shrink-0 flex items-center gap-2">
                           <span className="text-[10px] uppercase font-bold tracking-wider text-[#67afc3]/60 hidden sm:inline-block">Select</span>
                           <ChevronRight size={16} strokeWidth={2.5} className="text-[#67afc3]" />
                        </div>
                      ) : (
                         <ChevronRight size={16} strokeWidth={2.5} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                       )}
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>
          
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 flex items-center gap-4 text-[11px] text-slate-400 font-medium">
             <div className="flex items-center gap-1.5">
               <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-mono shadow-sm">↑↓</kbd>
               <span>Navegar</span>
             </div>
             <div className="flex items-center gap-1.5">
               <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-mono shadow-sm">↵</kbd>
               <span>Seleccionar</span>
             </div>
             <div className="flex items-center gap-1.5 ml-auto">
               <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-mono shadow-sm">ESC</kbd>
               <span>Cerrar</span>
             </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
