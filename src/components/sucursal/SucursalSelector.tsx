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
  // onBranchChange,
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
    <Dropdown key={sucursales.length}>
      <DropdownTrigger>
        <Button
          variant="flat"
          size="md"
          className={`group
            ${
              isCollapsed
                ? "min-w-[50px] w-[55px] h-[50px] p-0 justify-center text-slate-300 bg-transparent rounded-xl hover:bg-slate-700/50"
                : "w-full gap-2 text-white  bg-transparent border border-slate-600/50 px-4 py-5 rounded-xl hover:bg-slate-700/50"
            }
          `}
          startContent={
            isCollapsed ? null : (
              <IconSucursal className="group-hover:text-[#5fa7b8] transition-colors" />
            )
          }
          endContent={
            isCollapsed ? null : isChanging ? (
              <Spinner size="sm" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="h-3 w-3 group-hover:text-[#5fa7b8] transition-colors"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            )
          }
          disabled={isChanging}
        >
          {isCollapsed ? (
            <IconSucursal className="group-hover:text-[#5fa7b8] transition-colors" />
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="h-5 w-5 text-[#5fa7b8] transition-colors"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              ) : (
                <IconSucursal className="text-slate-400" />
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

function IconSucursal({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`w-5 h-5 ${className}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
      />
    </svg>
  );
}
