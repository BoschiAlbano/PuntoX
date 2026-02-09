"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  addToast,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: number;
  userName: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  usuarioId,
  userName,
}: ChangePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: async (nuevaPassword: string) => {
      const response = await fetch("/api/empleados/cambiar-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, nuevaPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al cambiar contraseña");
      }
      return await response.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
        color: "success",
      });
      onClose();
      // Reset fields
      setPassword("");
      setConfirmPassword("");
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    changePasswordMutation.mutate(password);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Cambiar Contraseña - {userName}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Nueva Contraseña"
              placeholder="Ingrese nueva contraseña"
              type="password"
              value={password}
              onValueChange={setPassword}
              errorMessage={
                error && error.includes("8 caracteres") ? error : undefined
              }
              isInvalid={!!error && error.includes("8 caracteres")}
            />
            <Input
              label="Confirmar Contraseña"
              placeholder="Repita la nueva contraseña"
              type="password"
              value={confirmPassword}
              onValueChange={setConfirmPassword}
              errorMessage={
                error && error.includes("no coinciden") ? error : undefined
              }
              isInvalid={!!error && error.includes("no coinciden")}
            />
            {error &&
              !error.includes("8 caracteres") &&
              !error.includes("no coinciden") && (
                <div className="text-danger text-sm">{error}</div>
              )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={changePasswordMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={changePasswordMutation.isPending}
            isDisabled={!password || !confirmPassword}
          >
            Guardar Cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
