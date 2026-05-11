"use client";

import { useState } from "react";
import {
  Button,
  Spinner,
  addToast,
} from "@heroui/react";
import { ChevronDown, Check, MapPin } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  /** Callback cuando cambia la sucursal */
  onBranchChange?: (sucursalId: string) => void;
  /** Mostrar solo si hay múltiples sucursales */
  hideIfSingle?: boolean;
  /** Mostrar comprimido (solo icono) */
  isCollapsed?: boolean;
};

export default function SucursalSelector({
  // onBranchChange,
  hideIfSingle = true,
  isCollapsed = false,
}: Props) {
  const sucursales = useUserStore((state) => state.branches);
  const sucursalActiva = useUserStore((state) => state.currentBranch);
  const isLoading = useUserStore((state) => state.isLoading);

  const [isChanging, setIsChanging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Cambiar sucursal activa
  const handleChangeBranch = async (sucursalId: string) => {
    if (sucursalActiva?.Id.toString() === sucursalId) return;

    setIsChanging(true);
    setIsOpen(false);
    try {
      const response = await fetch(`/api/sucursales/cambiar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sucursalId: Number(sucursalId) }),
      });

      if (!response.ok) {
        addToast({
          title: "Error",
          description: "Error al cambiar la sucursal",
          color: "danger",
        });
        return;
      }

      const data = await response.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error al cambiar la sucursal:", error);
    } finally {
      setIsChanging(false);
    }
  };

  // No mostrar si está cargando
  if (isLoading) {
    return null;
  }

  // No mostrar si solo hay una sucursal y hideIfSingle está activo
  if (hideIfSingle && sucursales.length <= 1) {
    return null;
  }

  // No mostrar si no hay sucursales
  if (sucursales.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      <Button
        variant="flat"
        size="md"
        onPress={() => setIsOpen(!isOpen)}
        className={`group relative
          ${
            isCollapsed
              ? "min-w-[50px] w-[55px] h-[50px] p-0 justify-center text-(--nav-item-icon) bg-transparent rounded-xl hover:bg-(--nav-item-hover-bg) hover:text-(--nav-item-hover-text) mx-auto"
              : "w-full gap-2 text-(--nav-item-text) bg-transparent border border-(--nav-divider) px-4 py-5 rounded-xl hover:bg-(--nav-item-hover-bg) hover:text-(--nav-item-hover-text)"
          }
        `}
        startContent={
          isCollapsed ? null : (
            <IconSucursal className={`group-hover:text-[#5fa7b8] transition-colors ${isOpen ? "text-[#5fa7b8]" : ""}`} />
          )
        }
        endContent={
          isCollapsed ? null : isChanging ? (
            <Spinner size="sm" />
          ) : (
            <ChevronDown
              className={`h-4 w-4 group-hover:text-[#5fa7b8] transition-transform duration-300 ${isOpen ? "rotate-180 text-[#5fa7b8]" : "text-(--nav-item-icon)"}`}
            />
          )
        }
        disabled={isChanging}
      >
        {isCollapsed ? (
          <IconSucursal className={`group-hover:text-[#5fa7b8] transition-colors ${isOpen ? "text-[#5fa7b8]" : ""}`} />
        ) : (
          <span className="truncate flex-1 text-left font-medium">
            {sucursalActiva?.Nombre || "Seleccionar sucursal"}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`overflow-hidden ${isCollapsed ? "px-0" : "px-0"} pt-1`}
          >
            <div className="flex flex-col gap-1 mt-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
              {sucursales.map((sucursal) => {
                const isSelected = sucursalActiva?.Id === sucursal.Id;
                return (
                  <button
                    key={sucursal.Id}
                    onClick={() => handleChangeBranch(sucursal.Id.toString())}
                    className={`flex items-center gap-3 w-full text-left rounded-lg transition-all
                      ${isCollapsed ? "justify-center p-2" : "px-3 py-2.5"}
                      ${
                        isSelected
                          ? "bg-[#5fa7b8]/10 text-[#5fa7b8]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                      }
                    `}
                    title={isCollapsed ? sucursal.Nombre : ""}
                  >
                    {!isCollapsed && (
                      <div className="shrink-0">
                        {isSelected ? (
                          <Check className="h-4 w-4 text-[#5fa7b8]" />
                        ) : (
                          <IconSucursal className="w-4 h-4 text-slate-400 opacity-60" />
                        )}
                      </div>
                    )}
                    
                    {isCollapsed ? (
                      <span className="text-[10px] font-bold truncate max-w-[40px] uppercase">
                        {sucursal.Nombre.substring(0, 3)}
                      </span>
                    ) : (
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`text-[13px] truncate ${isSelected ? "font-semibold" : "font-medium"}`}>
                          {sucursal.Nombre}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {sucursal.EsPrincipal ? "Casa Central" : sucursal.Direccion || "Sin dirección"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconSucursal({ className }: { className?: string }) {
  return <MapPin className={`w-4 h-4 ${className}`} strokeWidth={2} />;
}
