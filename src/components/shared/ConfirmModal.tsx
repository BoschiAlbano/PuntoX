"use client";

/**
 * Modal de confirmación genérico.
 * Reemplaza los modales inline de confirmación en GenericCrud, UsuariosCRUD, etc.
 *
 * @example
 * <ConfirmModal
 *   isOpen={isDeleteOpen}
 *   onClose={onDeleteClose}
 *   onConfirm={handleConfirmDelete}
 *   title="Confirmar Eliminación"
 *   description="¿Estás seguro? Esta acción no se puede deshacer."
 *   confirmLabel="Eliminar"
 *   variant="danger"
 *   isLoading={isSaving}
 * />
 */

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { modalMotionProps } from "@/lib/motionConfig";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  /** Color del botón de confirmación. Default: "primary" */
  variant?: "danger" | "primary" | "success";
  size?: "sm" | "md" | "lg";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isLoading = false,
  variant = "primary",
  size = "sm",
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      isDismissable={!isLoading}
      motionProps={modalMotionProps}
      classNames={{
        wrapper: "items-end sm:items-center",
        base: "rounded-t-2xl rounded-b-none sm:rounded-xl w-full sm:w-auto m-0 sm:m-auto",
      }}
    >
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            {description != null && (
              <ModalBody>
                {typeof description === "string" ? (
                  <p className="text-sm text-slate-600">{description}</p>
                ) : (
                  description
                )}
              </ModalBody>
            )}
            <ModalFooter>
              <Button
                variant="light"
                onPress={closeModal}
                isDisabled={isLoading}
              >
                {cancelLabel}
              </Button>
              <Button color={variant} onPress={onConfirm} isLoading={isLoading}>
                {confirmLabel}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
