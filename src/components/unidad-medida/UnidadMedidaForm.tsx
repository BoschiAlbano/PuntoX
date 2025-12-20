"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Switch,
} from "@heroui/react";
import { GenericFormProps } from "@/components/shared/GenericCrud";

export interface UnidadMedida {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
}

export default function UnidadMedidaGenericForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<UnidadMedida>) {
  const [formData, setFormData] = useState<Partial<UnidadMedida>>({
    Descripcion: "",
    EstaEliminado: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        Descripcion: "",
        EstaEliminado: false,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const isEdit = !!initialData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      backdrop="opaque"
      isDismissable={!isSaving}
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "bg-white",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-gray-200">
          <h3 className="text-xl font-bold">
            {isEdit ? "Editar Unidad de Medida" : "Nueva Unidad de Medida"}
          </h3>
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="space-y-4">
            <Input
              label="Descripción"
              placeholder="Nombre de la unidad de medida"
              value={formData.Descripcion || ""}
              onChange={(e) =>
                setFormData({ ...formData, Descripcion: e.target.value })
              }
              isRequired
              isDisabled={isSaving}
              maxLength={250}
              description={`${
                formData.Descripcion?.length || 0
              }/250 caracteres`}
            />
            <div className="flex items-center gap-2">
              <Switch
                isSelected={!formData.EstaEliminado}
                onValueChange={(value) =>
                  setFormData({ ...formData, EstaEliminado: !value })
                }
                color={formData.EstaEliminado ? "danger" : "success"}
                isDisabled={isSaving}
              >
                {formData.EstaEliminado
                  ? "Unidad de Medida Inactiva"
                  : "Unidad de Medida Activa"}
              </Switch>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="border-t border-gray-200">
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
          >
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isSaving}>
            {isEdit ? "Actualizar" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
