import { Button, ButtonProps } from "@heroui/react";
import { Pencil, Trash2, Plus } from "lucide-react";

const ICON_SIZE = 18;
const ICON_STROKE = 2;

interface ActionButtonProps extends ButtonProps {
  label?: string;
}

const baseButtonClass =
  "transition-all duration-150 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1";

export const EditButton = ({
  onPress,
  label = "Editar",
  ...props
}: ActionButtonProps) => {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="light"
      color="warning"
      onPress={onPress}
      {...props}
      className={`${baseButtonClass} ${props.className || ""}`}
      aria-label={label}
    >
      <Pencil
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        className="text-slate-600 transition-colors group-hover:text-warning-600"
      />
    </Button>
  );
};

export const DeleteButton = ({
  onPress,
  label = "Eliminar",
  ...props
}: ActionButtonProps) => {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="light"
      color="danger"
      onPress={onPress}
      {...props}
      className={`${baseButtonClass} ${props.className || ""}`}
      aria-label={label}
    >
      <Trash2
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        className="text-slate-600 transition-colors group-hover:text-danger-600"
      />
    </Button>
  );
};

export const AddStockButton = ({
  onPress,
  label = "Agregar Stock",
  ...props
}: ActionButtonProps) => {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="light"
      color="success"
      onPress={onPress}
      {...props}
      className={`${baseButtonClass} ${props.className || ""}`}
      aria-label={label}
    >
      <Plus
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        className="text-slate-600 transition-colors group-hover:text-success-600"
      />
    </Button>
  );
};
