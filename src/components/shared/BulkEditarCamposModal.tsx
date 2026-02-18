"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { useState } from "react";
import { addToast } from "@heroui/react";

export interface BulkEditarCamposItem {
  Id: number | string;
}

export interface BulkEditarCamposProducto extends BulkEditarCamposItem {
  Ubicacion?: string;
  StockMinimo?: number;
}

interface BulkEditarCamposModalProps<T extends BulkEditarCamposItem> {
  isOpen: boolean;
  onClose: () => void;
  items: T[];
  entityLabel: string;
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "number";
    placeholder?: string;
  }>;
  onConfirm: (
    ids: (number | string)[],
    values: Record<string, string | number>
  ) => Promise<void>;
  onSuccess?: () => void;
}

export function BulkEditarCamposModal<T extends BulkEditarCamposItem>({
  isOpen,
  onClose,
  items,
  entityLabel,
  fields,
  onConfirm,
  onSuccess,
}: BulkEditarCamposModalProps<T>) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, ""]))
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (items.length === 0) return;
    const filled = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "")
    );
    if (Object.keys(filled).length === 0) {
      addToast({
        title: "Campos vacíos",
        description: "Completa al menos un campo a actualizar",
        color: "warning",
      });
      return;
    }
    setIsLoading(true);
    try {
      const parsed: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(filled)) {
        const field = fields.find((f) => f.key === k);
        parsed[k] =
          field?.type === "number"
            ? (Number(v) || 0)
            : v;
      }
      await onConfirm(
        items.map((i) => i.Id),
        parsed
      );
      addToast({
        title: "Campos actualizados",
        description: `${items.length} ${entityLabel}${items.length !== 1 ? "s" : ""} actualizado${items.length !== 1 ? "s" : ""} correctamente`,
        color: "success",
      });
      onSuccess?.();
      onClose();
      setValues(Object.fromEntries(fields.map((f) => [f.key, ""])));
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Error al actualizar";
      addToast({ title: "Error", description: msg, color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="border-b border-gray-200">
          Editar campos comunes
        </ModalHeader>
        <ModalBody className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Se actualizarán los campos indicados en{" "}
            <strong>{items.length}</strong> {entityLabel}
            {items.length !== 1 ? "s" : ""} seleccionado
            {items.length !== 1 ? "s" : ""}. Deja vacío el que no quieras
            modificar.
          </p>
          <div className="flex flex-col gap-3">
            {fields.map((f) => (
              <Input
                key={f.key}
                label={f.label}
                type={f.type}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onValueChange={(v) =>
                  setValues((prev) => ({ ...prev, [f.key]: v }))
                }
              />
            ))}
          </div>
        </ModalBody>
        <ModalFooter className="border-t border-gray-200">
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-[#67afc3] hover:bg-[#5a9db0] text-white"
            onPress={handleConfirm}
            isLoading={isLoading}
          >
            Aplicar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
