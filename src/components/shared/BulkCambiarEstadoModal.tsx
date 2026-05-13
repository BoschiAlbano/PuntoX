"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  RadioGroup,
  Radio,
} from "@heroui/react";
import { useState } from "react";
import { addToast } from "@heroui/react";
import { modalMotionProps } from "@/lib/motionConfig";

export interface BulkEstadoItem {
  Id: number | string;
}

interface BulkCambiarEstadoModalProps<T extends BulkEstadoItem> {
  isOpen: boolean;
  onClose: () => void;
  items: T[];
  entityLabel: string;
  getCurrentEstado: (item: T) => boolean;
  onConfirm: (ids: (number | string)[], nuevoEstado: boolean) => Promise<void>;
  onSuccess?: () => void;
}

export function BulkCambiarEstadoModal<T extends BulkEstadoItem>({
  isOpen,
  onClose,
  items,
  entityLabel,
  getCurrentEstado,
  onConfirm,
  onSuccess,
}: BulkCambiarEstadoModalProps<T>) {
  const [estado, setEstado] = useState<"activo" | "inactivo">("inactivo");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (items.length === 0) return;
    setIsLoading(true);
    try {
      const nuevoEstado = estado === "activo";
      await onConfirm(
        items.map((i) => i.Id),
        nuevoEstado,
      );
      addToast({
        title: "Estado actualizado",
        description: `${items.length} ${entityLabel}${items.length !== 1 ? "s" : ""} actualizado${items.length !== 1 ? "s" : ""} correctamente`,
        color: "success",
      });
      onSuccess?.();
      onClose();
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      scrollBehavior="inside"
      motionProps={modalMotionProps}
      classNames={{
        wrapper: "items-end sm:items-center",
        base: "rounded-t-2xl rounded-b-none sm:rounded-2xl w-full sm:w-auto m-0 sm:m-auto max-h-[90vh]",
      }}
    >
      <ModalContent>
        <ModalHeader className="border-b border-gray-200">
          Cambiar estado
        </ModalHeader>
        <ModalBody className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Se cambiará el estado de <strong>{items.length}</strong>{" "}
            {entityLabel}
            {items.length !== 1 ? "s" : ""} seleccionado
            {items.length !== 1 ? "s" : ""}.
          </p>
          <RadioGroup
            label="Nuevo estado"
            value={estado}
            onValueChange={(v) => setEstado(v as "activo" | "inactivo")}
          >
            <Radio value="activo">Activo</Radio>
            <Radio value="inactivo">Inactivo</Radio>
          </RadioGroup>
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
