"use client";

import { Button, ButtonProps, Tooltip } from "@heroui/react";
import {
  Pencil,
  Trash2,
  Plus,
  Eye,
  CreditCard,
  KeyRound,
  LockKeyhole,
  LockKeyholeOpen,
} from "lucide-react";
import { ReactNode } from "react";

const ICON_SIZE = 16;
const ICON_STROKE = 2;

const tooltipClasses = {
  base: "before:bg-[#0F2233]",
  content: "bg-[#0F2233] text-white text-xs font-medium",
};

const baseButtonClass =
  "transition-all duration-150 hover:scale-105 active:scale-95 focus:outline-none";

// ---------------------------------------------------------------------------
// ActionTooltip
// ---------------------------------------------------------------------------
interface ActionTooltipProps {
  content: ReactNode;
  children: ReactNode;
  isDisabled?: boolean;
  placement?: "top" | "bottom" | "left" | "right";
}

export const ActionTooltip = ({
  content,
  children,
  isDisabled,
  placement = "top",
}: ActionTooltipProps) => (
  <Tooltip
    content={content}
    placement={placement}
    isDisabled={isDisabled}
    classNames={tooltipClasses}
  >
    {/* span wrapper so tooltip fires even when inner Button is isDisabled */}
    <span className="inline-flex">{children}</span>
  </Tooltip>
);

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------
interface ActionButtonProps extends Omit<ButtonProps, "children"> {
  label?: string;
  tooltipContent?: ReactNode;
}

// ---------------------------------------------------------------------------
// EditButton
// ---------------------------------------------------------------------------
export const EditButton = ({
  onPress,
  label = "Editar",
  tooltipContent,
  isDisabled,
  className,
  ...props
}: ActionButtonProps) => (
  <ActionTooltip content={tooltipContent ?? label}>
    <Button
      isIconOnly
      size="sm"
      variant="flat"
      onPress={onPress}
      isDisabled={isDisabled}
      aria-label={label}
      {...props}
      className={`${baseButtonClass}  text-yellow-500 bg-transparent ${className ?? ""}`}
    >
      <Pencil size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    </Button>
  </ActionTooltip>
);

// ---------------------------------------------------------------------------
// DeleteButton
// ---------------------------------------------------------------------------
export const DeleteButton = ({
  onPress,
  label = "Eliminar",
  tooltipContent,
  isDisabled,
  className,
  ...props
}: ActionButtonProps) => (
  <ActionTooltip content={tooltipContent ?? label}>
    <Button
      isIconOnly
      size="sm"
      variant="flat"
      onPress={onPress}
      isDisabled={isDisabled}
      aria-label={label}
      {...props}
      className={`${baseButtonClass} bg-transparent text-rose-500  ${className ?? ""}`}
    >
      <Trash2 size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    </Button>
  </ActionTooltip>
);

// ---------------------------------------------------------------------------
// AddStockButton
// ---------------------------------------------------------------------------
export const AddStockButton = ({
  onPress,
  label = "Agregar Stock",
  tooltipContent,
  isDisabled,
  className,
  ...props
}: ActionButtonProps) => (
  <ActionTooltip content={tooltipContent ?? label}>
    <Button
      isIconOnly
      size="sm"
      variant="flat"
      onPress={onPress}
      isDisabled={isDisabled}
      aria-label={label}
      {...props}
      className={`${baseButtonClass} bg-transparent text-emerald-500 ${className ?? ""}`}
    >
      <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    </Button>
  </ActionTooltip>
);

// ---------------------------------------------------------------------------
// ViewButton
// ---------------------------------------------------------------------------
export const ViewButton = ({
  onPress,
  label = "Ver detalle",
  tooltipContent,
  isDisabled,
  className,
  ...props
}: ActionButtonProps) => (
  <ActionTooltip content={tooltipContent ?? label}>
    <Button
      isIconOnly
      size="sm"
      variant="flat"
      onPress={onPress}
      isDisabled={isDisabled}
      aria-label={label}
      {...props}
      className={`${baseButtonClass} bg-transparent text-violet-500 ${className ?? ""}`}
    >
      <Eye size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    </Button>
  </ActionTooltip>
);

// ---------------------------------------------------------------------------
// CreditCardButton
// ---------------------------------------------------------------------------
interface CreditCardButtonProps extends ActionButtonProps {
  /** Cambia el color del botón a rojo cuando hay deuda pendiente */
  hasDebt?: boolean;
}

export const CreditCardButton = ({
  onPress,
  label = "Ver cuenta corriente",
  tooltipContent,
  isDisabled,
  hasDebt,
  className,
  ...props
}: CreditCardButtonProps) => (
  <ActionTooltip content={tooltipContent ?? label}>
    <Button
      isIconOnly
      size="sm"
      variant="flat"
      onPress={onPress}
      isDisabled={isDisabled}
      aria-label={label}
      {...props}
      className={`${baseButtonClass} ${
        hasDebt
          ? "bg-transparent text-red-500 "
          : "bg-transparent text-[#67afc3]"
      } ${className ?? ""}`}
    >
      <CreditCard size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    </Button>
  </ActionTooltip>
);

// ---------------------------------------------------------------------------
// PasswordButton
// ---------------------------------------------------------------------------
export const PasswordButton = ({
  onPress,
  label = "Cambiar contraseña",
  tooltipContent,
  isDisabled,
  className,
  ...props
}: ActionButtonProps) => (
  <ActionTooltip content={tooltipContent ?? label}>
    <Button
      isIconOnly
      size="sm"
      variant="flat"
      onPress={onPress}
      isDisabled={isDisabled}
      aria-label={label}
      {...props}
      className={`${baseButtonClass} bg-transparent text-violet-500 ${className ?? ""}`}
    >
      <KeyRound size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    </Button>
  </ActionTooltip>
);

// ---------------------------------------------------------------------------
// LockButton
// ---------------------------------------------------------------------------
interface LockButtonProps extends ActionButtonProps {
  /** true = cuenta bloqueada → muestra ícono desbloquear (verde) */
  isLocked?: boolean;
}

export const LockButton = ({
  onPress,
  label,
  tooltipContent,
  isDisabled,
  isLocked,
  className,
  ...props
}: LockButtonProps) => {
  const defaultLabel = isLocked ? "Desbloquear acceso" : "Bloquear acceso";
  return (
    <ActionTooltip content={tooltipContent ?? label ?? defaultLabel}>
      <Button
        isIconOnly
        size="sm"
        variant="flat"
        onPress={onPress}
        isDisabled={isDisabled}
        aria-label={label ?? defaultLabel}
        {...props}
        className={`${baseButtonClass} ${
          isLocked
            ? "bg-emerald-50 text-emerald-500 hover:bg-emerald-100"
            : "bg-orange-50 text-orange-500 hover:bg-orange-100"
        } ${className ?? ""}`}
      >
        {isLocked ? (
          <LockKeyholeOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        ) : (
          <LockKeyhole size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        )}
      </Button>
    </ActionTooltip>
  );
};
