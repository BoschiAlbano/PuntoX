import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  NumberInput,
  addToast,
} from "@heroui/react";
import { useState, useEffect, useRef } from "react";
import { Producto } from "@/lib/validations/producto.schema";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Producto | null;
  onConfirm: (quantity: number) => Promise<void>;
}

export default function AddStockModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: AddStockModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      addToast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        color: "danger",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(qty);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Agregar Stock: {product?.Descripcion}</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-500">
                  Stock actual:{" "}
                  <span className="font-bold text-gray-800">
                    {product?.Stock || 0}
                  </span>
                </p>
                <NumberInput
                  ref={inputRef}
                  label="Cantidad a sumar"
                  placeholder="1"
                  type="number"
                  minValue={1}
                  maxValue={1000}
                  value={quantity}
                  onValueChange={setQuantity}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirm();
                  }}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button
                color="success"
                onPress={handleConfirm}
                isLoading={isLoading}
                className="text-white"
              >
                Sumar Stock
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
