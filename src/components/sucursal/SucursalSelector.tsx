"use client";

import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Spinner,
  addToast,
} from "@heroui/react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

type Props = {
  /** Callback cuando cambia la sucursal */
  onBranchChange?: (sucursalId: string) => void;
  /** Mostrar solo si hay múltiples sucursales */
  hideIfSingle?: boolean;
  /** Mostrar comprimido (solo icono) */
  isCollapsed?: boolean;
};

export default function SucursalSelector({
  onBranchChange,
  hideIfSingle = true,
  isCollapsed = false,
}: Props) {
  const sucursales = useUserStore((state) => state.branches);
  const sucursalActiva = useUserStore((state) => state.currentBranch);
  const isLoading = useUserStore((state) => state.isLoading);

  const [isChanging, setIsChanging] = useState(false);

  // Cambiar sucursal activa
  const handleChangeBranch = async (sucursalId: string) => {
    if (sucursalActiva?.Id === sucursalId) return;

    setIsChanging(true);
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
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="flat"
          size="sm"
          className={`
            ${
              isCollapsed
                ? "w-auto justify-center bg-transparent hover:bg-slate-700/30 text-slate-300 hover:text-white "
                : "w-full gap-2 bg-slate-700/50 text-white hover:bg-slate-700 border border-slate-600/50 px-4 py-3"
            }
          `}
          startContent={isCollapsed ? null : <Building2 className="h-4 w-4" />}
          endContent={
            isCollapsed ? null : isChanging ? (
              <Spinner size="sm" color="white" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )
          }
          disabled={isChanging}
        >
          {isCollapsed ? (
            <Building2 className="h-5 w-5" />
          ) : (
            <span className="truncate flex-1 text-left">
              {sucursalActiva?.Nombre || "Seleccionar sucursal"}
            </span>
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Sucursales disponibles"
        selectionMode="single"
        className="w-[235px]"
        selectedKeys={sucursalActiva ? new Set([sucursalActiva.Id]) : new Set()}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          if (selected) {
            handleChangeBranch(selected);
          }
        }}
      >
        {sucursales.map((sucursal) => (
          <DropdownItem
            key={sucursal.Id}
            description={
              sucursal.EsPrincipal
                ? "Casa Central"
                : sucursal.Direccion || undefined
            }
            startContent={
              sucursalActiva?.Id === sucursal.Id ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Building2 className="h-4 w-4 text-slate-400" />
              )
            }
          >
            {sucursal.Nombre}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
