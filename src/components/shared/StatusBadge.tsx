"use client";

/**
 * Badge de estado Activo/Inactivo unificado.
 * Reemplaza el patrón `<Chip color={item.EstaEliminado ? "danger" : "success"} variant="flat" size="sm">` repetido en múltiples CRUDs.
 *
 * @example
 * <StatusBadge estaEliminado={item.EstaEliminado} />
 * <StatusBadge estaEliminado={item.EstaEliminado} activeLabel="Habilitado" inactiveLabel="Suspendido" />
 */

import { Chip } from "@heroui/react";

interface StatusBadgeProps {
  estaEliminado: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: "sm" | "md" | "lg";
}

export default function StatusBadge({
  estaEliminado,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
  size = "sm",
}: StatusBadgeProps) {
  return (
    <Chip
      color={estaEliminado ? "danger" : "success"}
      variant="flat"
      size={size}
    >
      {estaEliminado ? inactiveLabel : activeLabel}
    </Chip>
  );
}
