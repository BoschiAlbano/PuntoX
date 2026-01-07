"use client";

/**
 * =====================================================
 * SELECTOR DE SUCURSAL
 * =====================================================
 * 
 * Componente para seleccionar la sucursal activa.
 * Se muestra en el navbar cuando el usuario tiene acceso
 * a múltiples sucursales.
 * 
 * =====================================================
 */

import { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Spinner,
} from "@heroui/react";
import { Building2, ChevronDown, Check } from "lucide-react";

type Sucursal = {
  id: number;
  nombre: string;
  direccion: string | null;
  esPrincipal: boolean;
  estaActiva: boolean;
  esDefault: boolean;
};

type SucursalActiva = {
  id: number;
  nombre: string;
  esPrincipal: boolean;
};

type Props = {
  /** Callback cuando cambia la sucursal */
  onBranchChange?: (sucursalId: number) => void;
  /** Mostrar solo si hay múltiples sucursales */
  hideIfSingle?: boolean;
};

export default function SucursalSelector({ onBranchChange, hideIfSingle = true }: Props) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalActiva, setSucursalActiva] = useState<SucursalActiva | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  // Cargar sucursales del usuario
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await fetch("/api/sucursales/mis-sucursales");
        if (res.ok) {
          const data = await res.json();
          setSucursales(data.sucursales || []);
          setSucursalActiva(data.sucursalActiva || null);
        }
      } catch (error) {
        console.error("Error cargando sucursales:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSucursales();
  }, []);

  // Cambiar sucursal activa
  const handleChangeBranch = async (sucursalId: number) => {
    if (sucursalActiva?.id === sucursalId) return;

    setIsChanging(true);
    try {
      const res = await fetch("/api/sucursales/cambiar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sucursalId }),
      });

      if (res.ok) {
        const data = await res.json();
        setSucursalActiva(data.sucursal);
        
        // Notificar el cambio
        onBranchChange?.(sucursalId);
        
        // Recargar la página para actualizar todos los datos
        window.location.reload();
      }
    } catch (error) {
      console.error("Error cambiando sucursal:", error);
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
          className="w-full gap-2 bg-slate-700/50 text-white hover:bg-slate-700 border border-slate-600/50"
          startContent={<Building2 className="h-4 w-4" />}
          endContent={
            isChanging ? (
              <Spinner size="sm" color="white" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )
          }
          disabled={isChanging}
        >
          <span className="truncate flex-1 text-left">
            {sucursalActiva?.nombre || "Seleccionar sucursal"}
          </span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Sucursales disponibles"
        selectionMode="single"
        selectedKeys={sucursalActiva ? new Set([sucursalActiva.id.toString()]) : new Set()}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];
          if (selected) {
            handleChangeBranch(Number(selected));
          }
        }}
      >
        {sucursales.map((sucursal) => (
          <DropdownItem
            key={sucursal.id.toString()}
            description={sucursal.esPrincipal ? "Casa Central" : sucursal.direccion || undefined}
            startContent={
              sucursalActiva?.id === sucursal.id ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Building2 className="h-4 w-4 text-slate-400" />
              )
            }
          >
            {sucursal.nombre}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

