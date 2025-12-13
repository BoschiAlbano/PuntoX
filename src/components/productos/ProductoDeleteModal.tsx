import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Producto } from "@/lib/validations/producto.schema";

interface ProductoDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
  onConfirm: () => void;
  isSaving: boolean;
}

export default function ProductoDeleteModal({
  isOpen,
  onClose,
  producto,
  onConfirm,
  isSaving,
}: ProductoDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      backdrop="opaque"
      isDismissable={!isSaving}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-danger">
            Confirmar eliminación
          </h3>
        </ModalHeader>
        <ModalBody>
          <p>
            ¿Estás seguro de que deseas eliminar el producto{" "}
            <strong>{producto?.Descripcion}</strong>?
          </p>
          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isSaving}>
            Cancelar
          </Button>
          <Button color="danger" onPress={onConfirm} isLoading={isSaving}>
            Eliminar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
